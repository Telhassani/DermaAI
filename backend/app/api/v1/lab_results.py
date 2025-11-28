"""
Lab Results API - Endpoints for analyzing laboratory result files
Supports PDF and image file uploads with AI-powered data extraction
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from typing import Optional

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models import User
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.ai_analysis import AIAnalysis, AnalysisType, AnalysisStatus
from app.schemas.ai_analysis import LabResultAnalysisResponse
from app.services.lab_file_processor import lab_file_processor
from app.services.ai_analysis import ai_service
from app.services.ai_model_router import ai_model_router
from app.services.api_key_manager import api_key_manager
from app.core.logging import log_audit_event
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/upload-and-analyze",
    response_model=LabResultAnalysisResponse,
    status_code=201,
    summary="Upload and analyze lab results",
)
async def upload_and_analyze_lab_results(
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    consultation_id: Optional[int] = Form(None),
    additional_notes: Optional[str] = Form(None),
    selected_model: Optional[str] = Form(None),
    user_prompt: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Upload a lab result file (PDF or image) and perform AI analysis

    The file will be processed to extract lab values, which are then
    analyzed using the selected AI model for clinical interpretation.
    If no model is selected, uses Claude 3.5 Sonnet by default.

    Supports independent mode (research/personal use) where no patient
    context is required, or patient-linked mode for patient-specific analysis.

    - **file**: Lab result file (PDF or image: JPG, PNG, etc.)
    - **patient_id**: ID of the patient (optional - omit for independent research mode)
    - **consultation_id**: ID of the consultation (optional)
    - **additional_notes**: Additional clinical context (optional)
    - **selected_model**: AI model ID to use for analysis (optional, defaults to claude-opus-4-1-20250805)
    - **user_prompt**: Doctor's clinical guidance/instructions (optional)
    """
    try:
        # Verify user is a doctor
        if current_user.role.value != "DOCTOR":
            raise HTTPException(
                status_code=403,
                detail="Only doctors can analyze lab results"
            )

        # Verify patient exists and belongs to current doctor (if provided)
        patient = None
        if patient_id is not None:
            patient = db.query(Patient).filter(
                Patient.id == patient_id,
                Patient.doctor_id == current_user.id
            ).first()

            if not patient:
                raise HTTPException(
                    status_code=404,
                    detail="Patient not found or access denied"
                )

        # Verify consultation if provided
        if consultation_id is not None:
            consultation = db.query(Consultation).filter(
                Consultation.id == consultation_id,
                Consultation.doctor_id == current_user.id
            ).first()

            if not consultation:
                raise HTTPException(
                    status_code=404,
                    detail="Consultation not found or access denied"
                )

        # Validate file type
        if file.content_type not in ["application/pdf", "image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Accepted: PDF, JPG, PNG"
            )

        # Read file content
        file_content = await file.read()
        if not file_content:
            raise HTTPException(status_code=400, detail="File is empty")

        logger.info(f"Processing lab result file: {file.filename} for patient {patient_id}")

        # Determine model to use (default to Claude Sonnet 4.5)
        model_id = selected_model or "claude-sonnet-4-5-20250929"

        logger.info(f"Using model: {model_id} for analysis")

        # Get session API keys for current user
        session_keys = api_key_manager.get_keys(current_user.id)
        available_keys = api_key_manager.merge_with_environment_keys(session_keys)

        # Build patient context
        if patient:
            patient_context = f"Patient: {patient.first_name} {patient.last_name}"
        else:
            patient_context = "Independent Research Mode - No patient context"

        if additional_notes:
            patient_context += f"\nAdditional Context: {additional_notes}"

        # Use intelligent two-stage pipeline with AI model router
        analysis_result = await ai_model_router.analyze_lab_file(
            file_content=file_content,
            filename=file.filename,
            file_type=file.content_type,
            selected_model=model_id,
            user_prompt=user_prompt,
            patient_context=patient_context,
            api_keys=available_keys
        )

        if analysis_result.get("status") == "error":
            raise HTTPException(
                status_code=500,
                detail=analysis_result.get("error", "Failed to process lab results")
            )

        # Extract lab values and clinical analysis from result
        extracted_lab_values = analysis_result.get("lab_values", [])
        clinical_analysis = analysis_result.get("analysis", {})

        # Step 3: Save analysis to database
        new_analysis = AIAnalysis(
            analysis_type=AnalysisType.LAB_RESULT,
            patient_id=patient_id,
            doctor_id=current_user.id,
            consultation_id=consultation_id,
            status=AnalysisStatus.PENDING,
            input_data={
                "filename": file.filename,
                "file_type": file.content_type,
                "additional_notes": additional_notes,
                "selected_model": model_id,
                "user_prompt": user_prompt,
                "extraction_model": analysis_result.get("extraction_model"),
                "analysis_model": analysis_result.get("analysis_model"),
                "two_stage_pipeline": analysis_result.get("two_stage_pipeline", False),
                "user_guidance": analysis_result.get("user_guidance", "")
            },
            lab_values_extracted=extracted_lab_values,
            abnormal_values=clinical_analysis.get("abnormalities", []),
            reference_ranges=clinical_analysis.get("reference_ranges", []),
            primary_diagnosis=clinical_analysis.get("primary_diagnosis"),
            clinical_findings=clinical_analysis.get("clinical_findings", []),
            recommendations=clinical_analysis.get("recommendations", []),
            reasoning=clinical_analysis.get("reasoning", ""),
            confidence_score=clinical_analysis.get("confidence_score"),
        )

        db.add(new_analysis)
        db.commit()
        db.refresh(new_analysis)

        # Log audit event
        log_audit_event(
            user_id=str(current_user.id),
            action="ANALYZE_LAB_FILE",
            resource="ai_analysis",
            resource_id=str(new_analysis.id),
            details={
                "patient_id": patient_id,
                "file_name": file.filename,
                "lab_values_count": len(extracted_lab_values),
                "selected_model": model_id,
                "extraction_model": analysis_result.get("extraction_model"),
                "analysis_model": analysis_result.get("analysis_model"),
                "two_stage_pipeline": analysis_result.get("two_stage_pipeline", False)
            },
            success=True
        )

        logger.info(f"Lab analysis completed: ID {new_analysis.id}")

        return new_analysis

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing lab results: {str(e)}", exc_info=True)

        # Log failed audit event
        log_audit_event(
            user_id=str(current_user.id),
            action="ANALYZE_LAB_FILE",
            resource="ai_analysis",
            details={
                "patient_id": patient_id,
                "file_name": file.filename,
                "error": str(e)
            },
            success=False
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze lab results: {str(e)}"
        )


@router.get(
    "/available-models",
    summary="Get available AI models",
    tags=["Lab Results"]
)
async def get_available_models(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get list of available AI models for lab analysis.

    Returns models with their availability status based on configured API keys.
    """
    try:
        # Get session API keys for current user
        session_keys = api_key_manager.get_keys(current_user.id)

        # Merge with environment-based keys
        available_keys = api_key_manager.merge_with_environment_keys(session_keys)

        # Get models from router
        models = ai_model_router.get_available_models(available_keys)

        logger.info(f"Retrieved available models for user {current_user.id}")

        return {"models": models}

    except Exception as e:
        logger.error(f"Error retrieving available models: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve available models"
        )


@router.post(
    "/api-keys",
    summary="Store API keys for session",
    status_code=200,
    tags=["Lab Results"]
)
async def store_api_keys(
    keys: dict,
    current_user: User = Depends(get_current_active_user),
):
    """
    Securely store API keys for the current user's session.

    Keys are encrypted and stored for 1 hour with automatic expiration.
    Keys are never logged or permanently saved.

    Request body example:
    {
        "anthropic": "sk-ant-...",
        "openai": "sk-..."
    }
    """
    try:
        if not keys:
            raise HTTPException(
                status_code=400,
                detail="No API keys provided"
            )

        # Validate keys are provided as strings
        for key_name, key_value in keys.items():
            if not isinstance(key_value, str) or not key_value.strip():
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid API key for {key_name}: must be a non-empty string"
                )

        # Store keys securely
        api_key_manager.store_keys(current_user.id, keys)

        logger.info(f"Stored {len(keys)} API key(s) for user {current_user.id}")

        # Log audit event
        log_audit_event(
            user_id=str(current_user.id),
            action="STORE_API_KEYS",
            resource="api_keys",
            details={
                "key_count": len(keys),
                "key_names": list(keys.keys())
            },
            success=True
        )

        return {
            "message": "API keys stored securely",
            "expires_in_seconds": 3600,
            "keys_stored": len(keys)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error storing API keys: {str(e)}")

        log_audit_event(
            user_id=str(current_user.id),
            action="STORE_API_KEYS",
            resource="api_keys",
            details={"error": str(e)},
            success=False
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to store API keys"
        )
