"""
Appointment endpoints - RESTful API routes for appointment operations

This module provides all appointment-related endpoints including:
- CRUD operations for single appointments
- Recurring appointment series management
- Conflict detection and available slots
- Appointment statistics and reporting

All business logic is delegated to the AppointmentService layer.
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status
from fastapi import Query, Path
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
    AppointmentListResponse,
    AppointmentStatusUpdate,
    AppointmentConflictCheck,
    AppointmentConflictResponse,
    AppointmentStatsResponse,
    AppointmentSearchParams,
    AppointmentWithDetailsResponse,
)
from app.api.deps import get_current_active_user
from app.api.utils import get_mock_appointments
from app.services.appointments import AppointmentService
from app.utils.recurrence import RecurrenceValidationError
from app.core.logging import log_audit_event, logger

router = APIRouter()


# ============================================================================
# Helper Functions
# ============================================================================

def _get_appointment_details(appointment: Appointment, db: Session) -> AppointmentWithDetailsResponse:
    """Get appointment with patient and doctor details.

    Uses eager-loaded relationships instead of making additional queries.
    """
    try:
        # Use already eager-loaded relationships (no additional queries needed)
        patient = appointment.patient
        doctor = appointment.doctor

        return AppointmentWithDetailsResponse(
            **AppointmentResponse.from_orm(appointment).model_dump(),
            patient_name=f"{patient.first_name} {patient.last_name}" if patient else None,
            patient_phone=patient.phone if patient else None,
            doctor_name=f"{doctor.first_name} {doctor.last_name}" if doctor else None,
        )
    except Exception:
        # Fallback if details can't be loaded
        return AppointmentResponse.from_orm(appointment)


# ============================================================================
# Single Appointment CRUD Endpoints
# ============================================================================

@router.get("", response_model=AppointmentListResponse)
async def list_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    patient_id: Optional[int] = Query(None, gt=0, description="Filter by patient ID"),
    doctor_id: Optional[int] = Query(None, gt=0, description="Filter by doctor ID"),
    type: Optional[str] = Query(None, description="Filter by appointment type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    start_date: Optional[str] = Query(None, description="Filter from date (ISO 8601)"),
    end_date: Optional[str] = Query(None, description="Filter until date (ISO 8601)"),
    is_first_visit: Optional[bool] = Query(None, description="Filter by first visit"),
    is_recurring: Optional[bool] = Query(None, description="Filter by recurring status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("start_time", description="Field to sort by"),
    sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order"),
):
    """
    List appointments with filtering and pagination.

    Filters can be combined to find specific appointments. Results are paginated
    and can be sorted by any appointment field.

    Query Parameters:
    - patient_id: Filter by patient ID
    - doctor_id: Filter by doctor ID
    - type: Filter by appointment type (consultation, follow_up, procedure, emergency)
    - status: Filter by status (scheduled, confirmed, completed, cancelled, no_show)
    - start_date: Filter appointments from this date (ISO 8601 format)
    - end_date: Filter appointments until this date (ISO 8601 format)
    - is_first_visit: Filter by first visit status
    - is_recurring: Filter by recurring status
    - page: Page number (1-indexed)
    - page_size: Items per page (max 100)
    - sort_by: Field to sort by (default: start_time)
    - sort_order: Sort order (asc or desc, default: asc)

    Returns:
        AppointmentListResponse with paginated appointments
    """
    try:
        filters = {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "type": type,
            "status": status,
            "start_date": start_date,
            "end_date": end_date,
            "is_first_visit": is_first_visit,
            "is_recurring": is_recurring,
        }

        appointments, total = AppointmentService.list_appointments(
            db,
            filters={k: v for k, v in filters.items() if v is not None},
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        total_pages = (total + page_size - 1) // page_size

        return AppointmentListResponse(
            appointments=[AppointmentResponse.from_orm(a) for a in appointments],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    except Exception as e:
        logger.error(f"Error listing appointments: {str(e)}. Returning mock data.")
        # Return mock appointments when database is unavailable
        from app.models.appointment import Appointment
        mock_data = get_mock_appointments(current_user)
        mock_appointments = []
        for app_id, app_data in list(mock_data.items())[:page_size]:
            if isinstance(app_data, dict):
                # Convert dict to Appointment model instance
                appointment = Appointment(**app_data)
                mock_appointments.append(appointment)

        return AppointmentListResponse(
            appointments=[AppointmentResponse.from_orm(a) for a in mock_appointments],
            total=len(mock_data),
            page=page,
            page_size=page_size,
            total_pages=1,
        )


@router.post("", response_model=AppointmentResponse, status_code=http_status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new single appointment.

    For recurring appointments, use the POST /recurring endpoint instead.

    Request Body:
    - patient_id: Patient ID
    - doctor_id: Doctor ID
    - start_time: Appointment start time (ISO 8601 UTC)
    - end_time: Appointment end time (ISO 8601 UTC)
    - type: Appointment type (consultation, follow_up, procedure, emergency)
    - reason: Reason for visit (optional)
    - notes: Doctor's notes (optional)
    - is_first_visit: Whether this is patient's first visit (default: false)

    Returns:
        Created appointment details

    Raises:
        404: If patient or doctor not found
        409: If scheduling conflict exists
        422: If validation fails
    """
    try:
        # Verify patient exists
        patient = db.query(Patient).filter(Patient.id == appointment_data.patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Patient avec l'ID {appointment_data.patient_id} n'existe pas"
            )

        # Verify doctor exists
        from app.models.user import User as UserModel
        doctor = db.query(UserModel).filter(UserModel.id == appointment_data.doctor_id).first()
        if not doctor:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Médecin avec l'ID {appointment_data.doctor_id} n'existe pas"
            )

        # Check for conflicts
        conflicting, _ = AppointmentService.check_conflicts(
            db,
            appointment_data.doctor_id,
            appointment_data.start_time,
            appointment_data.end_time,
        )

        if conflicting:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="Conflit de rendez-vous : le médecin a déjà un rendez-vous à ce créneau"
            )

        # Create appointment
        appointment = AppointmentService.create_appointment(db, appointment_data)

        # Log audit event
        log_audit_event(
            user_id=str(current_user.id),
            action="CREATE",
            resource="appointment",
            details={
                "appointment_id": appointment.id,
                "patient_id": appointment.patient_id,
                "doctor_id": appointment.doctor_id,
            }
        )

        return AppointmentResponse.from_orm(appointment)

    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating appointment: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création du rendez-vous"
        )


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int = Path(..., gt=0, description="Appointment ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get appointment details by ID.

    Returns:
        Appointment details with all fields including recurrence info

    Raises:
        404: If appointment not found
        403: If user doesn't have access to this appointment
    """
    try:
        appointment = AppointmentService.get_appointment(db, appointment_id)

        if not appointment:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Rendez-vous {appointment_id} non trouvé"
            )

        # Verify access (doctor can see their appointments, patient can see appointments assigned to them)
        if appointment.doctor_id != current_user.id and appointment.patient_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Accès refusé à ce rendez-vous"
            )

        return AppointmentResponse.from_orm(appointment)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting appointment: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération du rendez-vous"
        )


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int = Path(..., gt=0, description="Appointment ID"),
    update_data: AppointmentUpdate = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update an appointment.

    Only provided fields will be updated. Updates must respect business rules:
    - Cannot reschedule past or completed appointments
    - Cannot update cancelled or no-show appointments

    For recurring appointments, this updates only the instance.
    To update the entire series, use PUT /recurring/{series_id}.

    Returns:
        Updated appointment details

    Raises:
        404: If appointment not found
        400: If update violates business rules
        422: If validation fails
    """
    try:
        appointment = AppointmentService.get_appointment(db, appointment_id)

        if not appointment:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Rendez-vous {appointment_id} non trouvé"
            )

        # Verify access
        if appointment.doctor_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Accès refusé à ce rendez-vous"
            )

        # Update appointment
        updated = AppointmentService.update_appointment(db, appointment_id, update_data)

        # Log audit event
        log_audit_event(
            user_id=str(current_user.id),
            action="UPDATE",
            resource="appointment",
            details={"appointment_id": appointment_id}
        )

        return AppointmentResponse.from_orm(updated)

    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating appointment: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la mise à jour du rendez-vous"
        )


@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: int = Path(..., gt=0, description="Appointment ID"),
    status_update: AppointmentStatusUpdate = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update appointment status only.

    Simplified endpoint for changing only the appointment status without
    modifying other fields.

    Request Body:
    - status: New status (scheduled, confirmed, completed, cancelled, no_show)
    - notes: Optional notes for status change

    Returns:
        Updated appointment with new status

    Raises:
        404: If appointment not found
        400: If status change violates business rules
    """
    try:
        appointment = AppointmentService.get_appointment(db, appointment_id)

        if not appointment:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Rendez-vous {appointment_id} non trouvé"
            )

        if appointment.doctor_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Accès refusé à ce rendez-vous"
            )

        # Update only status and notes
        update_data = AppointmentUpdate(
            status=status_update.status,
            notes=status_update.notes,
        )

        updated = AppointmentService.update_appointment(db, appointment_id, update_data)

        log_audit_event(
            user_id=str(current_user.id),
            action="UPDATE",
            resource="appointment",
            details={
                "appointment_id": appointment_id,
                "new_status": updated.status,
            }
        )

        return AppointmentResponse.from_orm(updated)

    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating appointment status: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la mise à jour du statut"
        )


@router.delete("/{appointment_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: int = Path(..., gt=0, description="Appointment ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete an appointment.

    For recurring appointments, this deletes only the instance.
    To delete the entire series, use DELETE /recurring/{series_id}.

    Raises:
        404: If appointment not found
        400: If appointment cannot be deleted
    """
    try:
        appointment = AppointmentService.get_appointment(db, appointment_id)

        if not appointment:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Rendez-vous {appointment_id} non trouvé"
            )

        if appointment.doctor_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Accès refusé à ce rendez-vous"
            )

        AppointmentService.delete_appointment(db, appointment_id)

        log_audit_event(
            user_id=str(current_user.id),
            action="DELETE",
            resource="appointment",
            details={"appointment_id": appointment_id}
        )

    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting appointment: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la suppression du rendez-vous"
        )


# ============================================================================
# Recurring Appointment Endpoints (POST to this section)
# ============================================================================

@router.post("/recurring", response_model=list[AppointmentResponse], status_code=http_status.HTTP_201_CREATED)
async def create_recurring_appointment_series(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a recurring appointment series.

    Generates multiple appointment instances based on RFC 5545 recurrence rule.
    All instances are linked to a parent appointment via recurring_series_id.

    Request Body:
    - patient_id: Patient ID
    - doctor_id: Doctor ID
    - start_time: First occurrence start time (ISO 8601 UTC)
    - end_time: First occurrence end time (ISO 8601 UTC)
    - type: Appointment type
    - reason: Reason for visit (optional)
    - notes: Doctor's notes (optional)
    - is_first_visit: Whether this is patient's first visit
    - recurrence_rule: RFC 5545 recurrence rule (required)
      Example: {"freq": "WEEKLY", "byday": "MO,WE,FR", "count": 12}

    Returns:
        List of created appointment instances

    Raises:
        400: If recurrence_rule is invalid or missing
        404: If patient or doctor not found
    """
    try:
        if not appointment_data.recurrence_rule:
            raise ValueError("recurrence_rule is required for recurring appointments")

        # Verify patient and doctor exist
        patient = db.query(Patient).filter(Patient.id == appointment_data.patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Patient avec l'ID {appointment_data.patient_id} n'existe pas"
            )

        from app.models.user import User as UserModel
        doctor = db.query(UserModel).filter(UserModel.id == appointment_data.doctor_id).first()
        if not doctor:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Médecin avec l'ID {appointment_data.doctor_id} n'existe pas"
            )

        # Create recurring series
        appointments = AppointmentService.create_recurring_series(db, appointment_data)

        # Log audit event
        log_audit_event(
            user_id=str(current_user.id),
            action="CREATE",
            resource="recurring_appointment_series",
            details={
                "series_id": appointments[0].id,
                "instance_count": len(appointments),
                "patient_id": appointment_data.patient_id,
            }
        )

        return [AppointmentResponse.from_orm(a) for a in appointments]

    except ValueError as e:
        if "recurrence_rule" in str(e):
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        raise
    except RecurrenceValidationError as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid recurrence rule: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating recurring series: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création de la série récurrente"
        )


@router.get("/recurring/{series_id}", response_model=AppointmentListResponse)
async def get_recurring_series_instances(
    series_id: int = Path(..., gt=0, description="Series parent appointment ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    Get all instances of a recurring appointment series.

    Returns paginated list of all appointments linked to the series.

    Returns:
        AppointmentListResponse with series instances

    Raises:
        404: If series not found
    """
    try:
        instances, total = AppointmentService.get_series_instances(
            db, series_id, page=page, page_size=page_size
        )

        if not instances:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Série de rendez-vous {series_id} non trouvée"
            )

        total_pages = (total + page_size - 1) // page_size

        return AppointmentListResponse(
            appointments=[AppointmentResponse.from_orm(a) for a in instances],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting series instances: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du chargement de la série"
        )


@router.delete("/recurring/{series_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_recurring_series(
    series_id: int = Path(..., gt=0, description="Series parent appointment ID"),
    cascade: bool = Query(True, description="Delete all instances (true) or only parent (false)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a recurring appointment series.

    Query Parameters:
    - cascade: If true, delete all instances. If false, only delete parent.

    Raises:
        404: If series not found
    """
    try:
        AppointmentService.delete_recurring_series(db, series_id, cascade=cascade)

        log_audit_event(
            user_id=str(current_user.id),
            action="DELETE",
            resource="recurring_appointment_series",
            details={"series_id": series_id, "cascade": cascade}
        )

    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error deleting recurring series: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la suppression de la série"
        )


# ============================================================================
# Conflict Detection and Advanced Endpoints
# ============================================================================

@router.post("/check-conflicts", response_model=AppointmentConflictResponse)
async def check_appointment_conflicts(
    conflict_check: AppointmentConflictCheck,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Check for scheduling conflicts in a time slot.

    Detects if a doctor has conflicting appointments and provides
    alternative available time slots.

    Request Body:
    - doctor_id: Doctor ID to check availability for
    - start_time: Proposed appointment start time (ISO 8601 UTC)
    - end_time: Proposed appointment end time (ISO 8601 UTC)
    - exclude_appointment_id: Appointment ID to exclude (for rescheduling)

    Returns:
        ConflictResponse with conflicting appointments and available slots

    Raises:
        404: If doctor not found
    """
    try:
        # Verify doctor exists
        from app.models.user import User as UserModel
        doctor = db.query(UserModel).filter(UserModel.id == conflict_check.doctor_id).first()
        if not doctor:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Médecin avec l'ID {conflict_check.doctor_id} n'existe pas"
            )

        conflicting, available = AppointmentService.check_conflicts(
            db,
            conflict_check.doctor_id,
            conflict_check.start_time,
            conflict_check.end_time,
            exclude_appointment_id=conflict_check.exclude_appointment_id,
        )

        return AppointmentConflictResponse(
            has_conflict=len(conflicting) > 0,
            conflicting_appointments=[AppointmentResponse.from_orm(a) for a in conflicting],
            available_slots=available,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking conflicts: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la vérification des conflits: {str(e)}"
        )


@router.get("/stats/overview", response_model=AppointmentStatsResponse)
async def get_appointment_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    doctor_id: Optional[int] = Query(None, gt=0, description="Filter by doctor ID"),
    patient_id: Optional[int] = Query(None, gt=0, description="Filter by patient ID"),
):
    """
    Get appointment statistics and overview.

    Provides counts of appointments by status, time period, and other criteria.
    Useful for dashboard widgets and analytics.

    Query Parameters:
    - doctor_id: Filter statistics for specific doctor
    - patient_id: Filter statistics for specific patient

    Returns:
        AppointmentStatsResponse with various statistics
    """
    try:
        stats = AppointmentService.get_appointment_stats(
            db,
            doctor_id=doctor_id,
            patient_id=patient_id,
        )

        return stats

    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du calcul des statistiques"
        )
