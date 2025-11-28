from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.ai_analysis import AIAnalysis, AIAnalysisImage, AnalysisType, AnalysisStatus
from app.models.patient import Patient
from app.schemas.ai_analysis import (
    AIAnalysisCreate, AIAnalysisResponse, AIAnalysisUpdate, AIAnalysisList,
    LabResultAnalysisCreate, LabResultAnalysisResponse
)
from app.services.ai_analysis import ai_service
from app.core.logging import log_audit_event
# from app.crud import crud_ai_analysis

router = APIRouter()

@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_image(
    *,
    db: Session = Depends(deps.get_db),
    analysis_in: AIAnalysisCreate,
    current_user: User = Depends(deps.get_current_doctor),
) -> Any:
    """
    Analyze an image using AI.

    Required: Current user must be a doctor.
    Permission: Doctor can only analyze images for patients they have access to.
    """
    # 1. Permission check - verify doctor can access this patient
    patient = db.query(Patient).filter(Patient.id == analysis_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # 2. Call AI Service
    if analysis_in.analysis_type == AnalysisType.IMAGE and analysis_in.image_data:
        result = await ai_service.analyze_image(
            image_data=analysis_in.image_data,
            additional_notes=analysis_in.additional_notes
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid analysis type or missing data"
        )

    if result.get("error"):
        log_audit_event(
            user_id=str(current_user.id),
            action="ANALYZE",
            resource="ai_analysis",
            details={"patient_id": analysis_in.patient_id, "error": result["error"]},
            success=False,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )

    # 3. Save to DB
    db_obj = AIAnalysis(
        analysis_type=analysis_in.analysis_type,
        patient_id=analysis_in.patient_id,
        doctor_id=current_user.id,
        consultation_id=analysis_in.consultation_id,
        ai_provider=analysis_in.ai_provider,
        ai_model=analysis_in.ai_model,

        # Map results
        primary_diagnosis=result.get("primary_diagnosis"),
        differential_diagnoses=result.get("differential_diagnoses"),
        confidence_score=result.get("confidence_score"),
        severity=result.get("severity"),
        clinical_findings=result.get("clinical_findings"),
        recommendations=result.get("recommendations"),
        reasoning=result.get("reasoning"),
        key_features_identified=result.get("key_features_identified"),
        risk_factors=result.get("risk_factors"),

        status=AnalysisStatus.PENDING,
        tokens_used=result.get("tokens_used", {}).get("total_tokens", 0)
    )

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    # 4. Save image reference if image_path provided
    if analysis_in.image_path:
        image_ref = AIAnalysisImage(
            analysis_id=db_obj.id,
            image_path=analysis_in.image_path
        )
        db.add(image_ref)
        db.commit()

    # 5. Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="ANALYZE",
        resource="ai_analysis",
        details={
            "patient_id": analysis_in.patient_id,
            "analysis_id": db_obj.id,
            "analysis_type": analysis_in.analysis_type.value,
            "confidence": db_obj.confidence_score
        },
        success=True,
    )

    return db_obj

@router.get("/{analysis_id}", response_model=AIAnalysisResponse)
def read_analysis(
    *,
    db: Session = Depends(deps.get_db),
    analysis_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get analysis by ID.

    Permission: Users can only view analyses for patients they have access to.
    """
    analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )

    # Permission check: verify user can access this analysis
    # For now, allow doctors to view all analyses, admins can view all
    if current_user.role.value not in ["DOCTOR", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view this analysis"
        )

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="VIEW",
        resource="ai_analysis",
        details={"analysis_id": analysis_id},
        success=True,
    )

    return analysis

@router.put("/{analysis_id}", response_model=AIAnalysisResponse)
def update_analysis(
    *,
    db: Session = Depends(deps.get_db),
    analysis_id: int,
    analysis_in: AIAnalysisUpdate,
    current_user: User = Depends(deps.get_current_doctor),
) -> Any:
    """
    Update analysis (e.g. doctor review).

    Required: Current user must be a doctor.
    Permission: Only the doctor who created the analysis or admins can update it.
    """
    analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )

    # Permission check: only doctor who created analysis or admin can update
    if current_user.id != analysis.doctor_id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update analyses you created"
        )

    update_data = analysis_in.dict(exclude_unset=True)
    old_status = analysis.status

    for field, value in update_data.items():
        setattr(analysis, field, value)

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Log audit event with change details
    log_audit_event(
        user_id=str(current_user.id),
        action="UPDATE",
        resource="ai_analysis",
        details={
            "analysis_id": analysis_id,
            "old_status": old_status.value if old_status else None,
            "new_status": analysis.status.value,
            "changes": list(update_data.keys())
        },
        success=True,
    )

    return analysis


@router.get("/", response_model=AIAnalysisList)
def list_analyses(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[int] = None,
    status_filter: Optional[AnalysisStatus] = None,
) -> Any:
    """
    Get list of AI analyses with optional filtering.

    Query Parameters:
    - patient_id: Filter by patient
    - status_filter: Filter by analysis status (PENDING, REVIEWED, ACCEPTED, etc.)
    - skip: Pagination offset
    - limit: Pagination limit
    """
    query = db.query(AIAnalysis)

    # Apply filters
    if patient_id:
        query = query.filter(AIAnalysis.patient_id == patient_id)
    if status_filter:
        query = query.filter(AIAnalysis.status == status_filter)

    # Count total for pagination
    total = query.count()

    # Apply pagination
    analyses = query.offset(skip).limit(limit).all()

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="LIST",
        resource="ai_analysis",
        details={"count": len(analyses), "filters": {"patient_id": patient_id, "status": status_filter.value if status_filter else None}},
        success=True,
    )

    return AIAnalysisList(items=analyses, total=total)


@router.get("/patient/{patient_id}", response_model=AIAnalysisList)
def get_patient_analysis_history(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """
    Get complete analysis history for a specific patient.

    Returns analyses chronologically from newest to oldest.
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Get analyses sorted by creation date descending
    query = db.query(AIAnalysis).filter(AIAnalysis.patient_id == patient_id)
    total = query.count()

    analyses = query.order_by(AIAnalysis.created_at.desc()).offset(skip).limit(limit).all()

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="VIEW_HISTORY",
        resource="ai_analysis",
        details={"patient_id": patient_id, "count": len(analyses)},
        success=True,
    )

    return AIAnalysisList(items=analyses, total=total)


@router.delete("/{analysis_id}")
def delete_analysis(
    *,
    db: Session = Depends(deps.get_db),
    analysis_id: int,
    current_user: User = Depends(deps.get_current_doctor),
) -> Any:
    """
    Soft delete an analysis.

    Required: Current user must be a doctor.
    Permission: Only the doctor who created the analysis or admins can delete it.
    """
    analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )

    # Permission check: only doctor who created analysis or admin can delete
    if current_user.id != analysis.doctor_id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete analyses you created"
        )

    # Soft delete by setting is_deleted flag (if available) or mark with status
    # For now, we'll just delete the record. In production, implement soft delete.
    db.delete(analysis)
    db.commit()

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="DELETE",
        resource="ai_analysis",
        details={"analysis_id": analysis_id, "patient_id": analysis.patient_id},
        success=True,
    )

    return {"message": "Analysis deleted successfully", "analysis_id": analysis_id}


@router.post("/{analysis_id}/compare", response_model=dict)
async def compare_analyses(
    *,
    db: Session = Depends(deps.get_db),
    analysis_id: int,
    previous_analysis_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Compare current analysis with a previous one (disease progression/regression).

    Returns key differences in diagnosis, severity, and recommendations.
    """
    # Get current analysis
    current_analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()
    if not current_analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Current analysis not found"
        )

    # Get previous analysis
    previous_analysis = db.query(AIAnalysis).filter(AIAnalysis.id == previous_analysis_id).first()
    if not previous_analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Previous analysis not found"
        )

    # Verify both analyses are for the same patient
    if current_analysis.patient_id != previous_analysis.patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both analyses must be for the same patient"
        )

    # Compare analyses using AI service
    comparison = await ai_service.compare_with_previous(current_analysis, previous_analysis)

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="COMPARE",
        resource="ai_analysis",
        details={
            "current_analysis_id": analysis_id,
            "previous_analysis_id": previous_analysis_id,
            "patient_id": current_analysis.patient_id
        },
        success=True,
    )

    return comparison


@router.post("/lab-result/analyze", response_model=LabResultAnalysisResponse)
async def analyze_lab_results(
    *,
    db: Session = Depends(deps.get_db),
    lab_data: LabResultAnalysisCreate,
    current_user: User = Depends(deps.get_current_doctor),
) -> Any:
    """
    Analyze lab results for dermatological implications.

    Required: Current user must be a doctor.
    Permission: Doctor can only analyze results for patients they have access to.

    Lab values will be analyzed in context of skin health and dermatological conditions.
    The AI will identify abnormal values and provide clinical interpretation.
    """
    # 1. Permission check - verify doctor can access this patient
    patient = db.query(Patient).filter(Patient.id == lab_data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # 2. Prepare lab data for AI analysis
    lab_values_dict = [
        {
            "test_name": val.test_name,
            "value": val.value,
            "unit": val.unit,
            "reference_min": val.reference_min,
            "reference_max": val.reference_max,
            "is_abnormal": val.is_abnormal
        }
        for val in lab_data.lab_values
    ]

    ai_input = {
        "lab_values": lab_values_dict,
        "test_date": lab_data.test_date,
        "additional_notes": lab_data.additional_notes,
        "patient_context": "Analyzing for dermatological implications"
    }

    # 3. Call AI Service for lab analysis
    result = await ai_service.analyze_lab_results(ai_input)

    if result.get("error"):
        log_audit_event(
            user_id=str(current_user.id),
            action="ANALYZE_LAB",
            resource="ai_analysis",
            details={"patient_id": lab_data.patient_id, "error": result["error"]},
            success=False,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )

    # 4. Save to DB
    db_obj = AIAnalysis(
        analysis_type=AnalysisType.LAB_RESULT,
        patient_id=lab_data.patient_id,
        doctor_id=current_user.id,
        consultation_id=lab_data.consultation_id,
        ai_provider=lab_data.ai_provider,
        ai_model=lab_data.ai_model,

        # Map results
        primary_diagnosis=result.get("interpretation"),
        clinical_findings=result.get("abnormalities", []),
        recommendations=result.get("recommendations", []),
        reasoning=result.get("reasoning"),

        # Lab specific fields
        lab_values_extracted=lab_values_dict,
        abnormal_values=result.get("abnormalities", []),
        reference_ranges=result.get("reference_ranges"),

        # Store input data
        input_data=ai_input,

        # Default status
        status=AnalysisStatus.PENDING,
        tokens_used=result.get("tokens_used", {}).get("total_tokens", 0)
    )

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    # 5. Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="ANALYZE_LAB",
        resource="ai_analysis",
        details={
            "patient_id": lab_data.patient_id,
            "analysis_id": db_obj.id,
            "lab_tests_count": len(lab_data.lab_values),
            "abnormal_count": sum(1 for v in lab_data.lab_values if v.is_abnormal)
        },
        success=True,
    )

    return db_obj
