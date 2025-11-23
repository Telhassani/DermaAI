from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.ai_analysis import AIAnalysis, AnalysisType, AnalysisStatus
from app.schemas.ai_analysis import AIAnalysisCreate, AIAnalysisResponse, AIAnalysisUpdate, AIAnalysisList
from app.services.ai_analysis import ai_service
# from app.crud import crud_ai_analysis

router = APIRouter()

@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_image(
    *,
    db: Session = Depends(deps.get_db),
    analysis_in: AIAnalysisCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Analyze an image using AI.
    """
    # 1. Call AI Service
    if analysis_in.analysis_type == AnalysisType.IMAGE and analysis_in.image_data:
        result = await ai_service.analyze_image(
            image_data=analysis_in.image_data,
            additional_notes=analysis_in.additional_notes
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid analysis type or missing data")
    
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])

    # 2. Save to DB
    # We need a CRUD utility. For now, I'll do it inline or create a simple CRUD.
    # Let's create the object directly.
    
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
        tokens_used=result.get("tokens_used", {}).get("total_tokens", 0) # Approximate
    )
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
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
    """
    analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@router.put("/{analysis_id}", response_model=AIAnalysisResponse)
def update_analysis(
    *,
    db: Session = Depends(deps.get_db),
    analysis_id: int,
    analysis_in: AIAnalysisUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update analysis (e.g. doctor review).
    """
    analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    update_data = analysis_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(analysis, field, value)
        
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis
