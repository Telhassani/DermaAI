"""
Appointment service layer - Business logic for appointment operations

This module provides the AppointmentService class which encapsulates all
appointment-related business logic including CRUD operations, recurrence
handling, and conflict detection.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_

from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.patient import Patient
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
    AppointmentConflictResponse,
    AppointmentStatsResponse,
)
from app.utils.recurrence import RecurrenceValidator, RecurrenceValidationError
from app.core.logging import logger


# ============================================================================
# Service Class
# ============================================================================


class AppointmentService:
    """
    Service layer for appointment operations.

    Handles all business logic for creating, reading, updating, and deleting
    appointments. Includes support for recurring appointment series, conflict
    detection, and appointment statistics.
    """

    # ========================================================================
    # CRUD Operations
    # ========================================================================

    @staticmethod
    def create_appointment(
        db: Session,
        create_data: AppointmentCreate,
    ) -> Appointment:
        """
        Create a single appointment (non-recurring).

        Args:
            db: Database session
            create_data: Appointment creation schema

        Returns:
            Created Appointment object

        Raises:
            ValueError: If recurrence_rule is provided (use create_recurring_series instead)
        """
        if create_data.recurrence_rule:
            raise ValueError(
                "Cannot create recurring appointment with create_appointment(). "
                "Use create_recurring_series() instead."
            )

        appointment = Appointment(
            patient_id=create_data.patient_id,
            doctor_id=create_data.doctor_id,
            start_time=create_data.start_time,
            end_time=create_data.end_time,
            type=create_data.type,
            reason=create_data.reason,
            notes=create_data.notes,
            is_first_visit=create_data.is_first_visit,
        )

        db.add(appointment)
        db.commit()
        db.refresh(appointment)

        logger.info(
            f"Created appointment {appointment.id} for patient {appointment.patient_id}",
            extra={"appointment_id": appointment.id, "patient_id": appointment.patient_id}
        )

        return appointment

    @staticmethod
    def get_appointment(db: Session, appointment_id: int) -> Optional[Appointment]:
        """
        Retrieve a single appointment by ID.

        Args:
            db: Database session
            appointment_id: Appointment ID

        Returns:
            Appointment object or None if not found
        """
        return db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor)
        ).filter(
            Appointment.id == appointment_id
        ).first()

    @staticmethod
    def update_appointment(
        db: Session,
        appointment_id: int,
        update_data: AppointmentUpdate,
    ) -> Appointment:
        """
        Update a single appointment.

        For recurring appointments, this updates only the instance, not the series.
        To update the entire series, use update_recurring_series().

        Args:
            db: Database session
            appointment_id: Appointment ID
            update_data: Update schema with partial data

        Returns:
            Updated Appointment object

        Raises:
            ValueError: If appointment not found or cannot be rescheduled
        """
        appointment = db.query(Appointment).filter(
            Appointment.id == appointment_id
        ).first()

        if not appointment:
            raise ValueError(f"Appointment {appointment_id} not found")

        if not appointment.can_be_rescheduled():
            raise ValueError(
                f"Appointment {appointment_id} cannot be rescheduled "
                f"(status: {appointment.status}, is_past: {appointment.is_past})"
            )

        # Update provided fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                setattr(appointment, key, value)

        db.commit()
        db.refresh(appointment)

        logger.info(
            f"Updated appointment {appointment_id}",
            extra={"appointment_id": appointment_id}
        )

        return appointment

    @staticmethod
    def delete_appointment(db: Session, appointment_id: int) -> None:
        """
        Delete a single appointment.

        For recurring appointments, this deletes only the instance.
        To delete the entire series, use delete_recurring_series().

        Args:
            db: Database session
            appointment_id: Appointment ID

        Raises:
            ValueError: If appointment not found or cannot be deleted
        """
        appointment = db.query(Appointment).filter(
            Appointment.id == appointment_id
        ).first()

        if not appointment:
            raise ValueError(f"Appointment {appointment_id} not found")

        if not appointment.can_be_cancelled():
            raise ValueError(
                f"Appointment {appointment_id} cannot be cancelled "
                f"(status: {appointment.status})"
            )

        db.delete(appointment)
        db.commit()

        logger.info(
            f"Deleted appointment {appointment_id}",
            extra={"appointment_id": appointment_id}
        )

    @staticmethod
    def list_appointments(
        db: Session,
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "start_time",
        sort_order: str = "asc",
    ) -> Tuple[List[Appointment], int]:
        """
        List appointments with filtering and pagination.

        Args:
            db: Database session
            filters: Filter criteria (patient_id, doctor_id, status, type, etc.)
            page: Page number (1-indexed)
            page_size: Items per page
            sort_by: Field to sort by
            sort_order: "asc" or "desc"

        Returns:
            Tuple of (appointments list, total count)
        """
        query = db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor)
        )

        # Apply filters
        if filters:
            if "patient_id" in filters and filters["patient_id"]:
                query = query.filter(Appointment.patient_id == filters["patient_id"])
            if "doctor_id" in filters and filters["doctor_id"]:
                query = query.filter(Appointment.doctor_id == filters["doctor_id"])
            if "status" in filters and filters["status"]:
                query = query.filter(Appointment.status == filters["status"])
            if "type" in filters and filters["type"]:
                query = query.filter(Appointment.type == filters["type"])
            if "start_date" in filters and filters["start_date"]:
                query = query.filter(Appointment.start_time >= filters["start_date"])
            if "end_date" in filters and filters["end_date"]:
                query = query.filter(Appointment.end_time <= filters["end_date"])
            if "is_first_visit" in filters and filters["is_first_visit"] is not None:
                query = query.filter(Appointment.is_first_visit == filters["is_first_visit"])
            if "is_recurring" in filters and filters["is_recurring"] is not None:
                if filters["is_recurring"]:
                    query = query.filter(
                        or_(
                            Appointment.recurrence_rule.isnot(None),
                            Appointment.recurring_series_id.isnot(None),
                        )
                    )
                else:
                    query = query.filter(
                        and_(
                            Appointment.recurrence_rule.is_(None),
                            Appointment.recurring_series_id.is_(None),
                        )
                    )

        # Get total count
        total = query.count()

        # Apply sorting
        sort_column = getattr(Appointment, sort_by, Appointment.start_time)
        if sort_order.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Apply pagination
        skip = (page - 1) * page_size
        appointments = query.offset(skip).limit(page_size).all()

        return appointments, total

    # ========================================================================
    # Recurring Appointment Operations
    # ========================================================================

    @staticmethod
    def create_recurring_series(
        db: Session,
        create_data: AppointmentCreate,
    ) -> List[Appointment]:
        """
        Create a recurring appointment series.

        Generates multiple appointment instances based on the recurrence rule.
        All instances are linked via recurring_series_id.

        Args:
            db: Database session
            create_data: Appointment creation schema with recurrence_rule

        Returns:
            List of created Appointment objects

        Raises:
            ValueError: If recurrence_rule is invalid or missing
        """
        if not create_data.recurrence_rule:
            raise ValueError("recurrence_rule is required for recurring appointments")

        # Validate recurrence rule
        try:
            RecurrenceValidator.validate_recurrence_rule(create_data.recurrence_rule)
        except RecurrenceValidationError as e:
            raise ValueError(f"Invalid recurrence rule: {str(e)}")

        # Generate occurrences
        occurrences = RecurrenceValidator.expand_recurrence(
            create_data.recurrence_rule,
            create_data.start_time,
            max_occurrences=365,
        )

        # Create parent appointment with recurrence rule
        parent = Appointment(
            patient_id=create_data.patient_id,
            doctor_id=create_data.doctor_id,
            start_time=create_data.start_time,
            end_time=create_data.end_time,
            type=create_data.type,
            reason=create_data.reason,
            notes=create_data.notes,
            is_first_visit=create_data.is_first_visit,
            recurrence_rule=create_data.recurrence_rule,
        )

        db.add(parent)
        db.flush()  # Get the parent ID without committing yet

        # Create child instances
        appointments = [parent]
        for occurrence_time in occurrences[1:]:  # Skip first, already created as parent
            duration = create_data.end_time - create_data.start_time
            instance = Appointment(
                patient_id=create_data.patient_id,
                doctor_id=create_data.doctor_id,
                start_time=occurrence_time,
                end_time=occurrence_time + duration,
                type=create_data.type,
                reason=create_data.reason,
                notes=create_data.notes,
                is_first_visit=create_data.is_first_visit,
                recurring_series_id=parent.id,
            )
            db.add(instance)
            appointments.append(instance)

        db.commit()

        # Refresh all to get IDs
        for appt in appointments:
            db.refresh(appt)

        logger.info(
            f"Created recurring appointment series with {len(appointments)} instances",
            extra={
                "series_id": parent.id,
                "instance_count": len(appointments),
                "patient_id": create_data.patient_id,
            }
        )

        return appointments

    @staticmethod
    def get_series_instances(
        db: Session,
        series_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Appointment], int]:
        """
        Get all instances of a recurring appointment series.

        Args:
            db: Database session
            series_id: Parent appointment ID
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (instances list, total count)
        """
        # Get parent
        parent = db.query(Appointment).filter(Appointment.id == series_id).first()
        if not parent:
            raise ValueError(f"Appointment series {series_id} not found")

        # Get all instances linked to this series
        query = db.query(Appointment).filter(
            or_(
                Appointment.id == series_id,
                Appointment.recurring_series_id == series_id,
            )
        ).order_by(Appointment.start_time.asc())

        total = query.count()
        skip = (page - 1) * page_size
        instances = query.offset(skip).limit(page_size).all()

        return instances, total

    @staticmethod
    def delete_recurring_series(
        db: Session,
        series_id: int,
        cascade: bool = True,
    ) -> int:
        """
        Delete a recurring appointment series.

        Args:
            db: Database session
            series_id: Parent appointment ID
            cascade: If True, delete all instances. If False, only delete parent.

        Returns:
            Number of appointments deleted

        Raises:
            ValueError: If series not found
        """
        parent = db.query(Appointment).filter(Appointment.id == series_id).first()
        if not parent:
            raise ValueError(f"Appointment series {series_id} not found")

        deleted_count = 0

        if cascade:
            # Delete all instances
            instances = db.query(Appointment).filter(
                or_(
                    Appointment.id == series_id,
                    Appointment.recurring_series_id == series_id,
                )
            ).all()

            for appt in instances:
                if appt.can_be_cancelled():
                    db.delete(appt)
                    deleted_count += 1
        else:
            # Delete only parent
            if parent.can_be_cancelled():
                db.delete(parent)
                deleted_count = 1

        db.commit()

        logger.info(
            f"Deleted recurring appointment series {series_id} ({deleted_count} instances)",
            extra={"series_id": series_id, "deleted_count": deleted_count}
        )

        return deleted_count

    # ========================================================================
    # Conflict Detection
    # ========================================================================

    @staticmethod
    def check_conflicts(
        db: Session,
        doctor_id: int,
        start_time: datetime,
        end_time: datetime,
        exclude_appointment_id: Optional[int] = None,
    ) -> Tuple[List[Appointment], List[Dict[str, datetime]]]:
        """
        Check for appointment conflicts for a doctor in a time slot.

        Args:
            db: Database session
            doctor_id: Doctor ID
            start_time: Proposed appointment start time
            end_time: Proposed appointment end time
            exclude_appointment_id: Appointment ID to exclude (for rescheduling)

        Returns:
            Tuple of (conflicting appointments list, available slots list)
        """
        # Find overlapping appointments with eager loading
        query = db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor)
        ).filter(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.start_time < end_time,
                Appointment.end_time > start_time,
                Appointment.status.in_([
                    AppointmentStatus.SCHEDULED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.IN_PROGRESS,
                ]),
            )
        )

        if exclude_appointment_id:
            query = query.filter(Appointment.id != exclude_appointment_id)

        conflicting = query.all()

        # Find available slots
        available_slots = AppointmentService._find_available_slots(
            db, doctor_id, start_time.date(), (end_time - start_time).total_seconds() / 60
        )

        return conflicting, available_slots

    @staticmethod
    def _find_available_slots(
        db: Session,
        doctor_id: int,
        date: Any,
        duration_minutes: float,
        working_hours_start: int = 9,
        working_hours_end: int = 17,
    ) -> List[Dict[str, datetime]]:
        """
        Find available time slots on a given day.

        Args:
            db: Database session
            doctor_id: Doctor ID
            date: Date to find slots for
            duration_minutes: Required appointment duration
            working_hours_start: Working hours start (hour, 0-23)
            working_hours_end: Working hours end (hour, 0-23)

        Returns:
            List of available time slots with start/end times
        """
        # Get all appointments for the doctor on that day with eager loading
        appointments = db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor)
        ).filter(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.start_time >= datetime.combine(date, datetime.min.time()),
                Appointment.start_time < datetime.combine(date, datetime.max.time()),
                Appointment.status.in_([
                    AppointmentStatus.SCHEDULED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.IN_PROGRESS,
                ]),
            )
        ).order_by(Appointment.start_time.asc()).all()

        # Generate available slots
        slots = []
        work_start = datetime.combine(date, datetime.min.time()).replace(hour=working_hours_start)
        work_end = datetime.combine(date, datetime.max.time()).replace(hour=working_hours_end)

        if not appointments:
            # Entire day is available
            slots.append({
                "start_time": work_start,
                "end_time": work_end,
            })
            return slots

        # Find gaps between appointments
        current = work_start
        for appt in appointments:
            if (appt.start_time - current).total_seconds() / 60 >= duration_minutes:
                slots.append({
                    "start_time": current,
                    "end_time": appt.start_time,
                })
            current = max(current, appt.end_time)

        # Check if there's space after last appointment
        if (work_end - current).total_seconds() / 60 >= duration_minutes:
            slots.append({
                "start_time": current,
                "end_time": work_end,
            })

        return slots

    # ========================================================================
    # Statistics
    # ========================================================================

    @staticmethod
    def get_appointment_stats(
        db: Session,
        doctor_id: Optional[int] = None,
        patient_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> AppointmentStatsResponse:
        """
        Get appointment statistics.

        Args:
            db: Database session
            doctor_id: Filter by doctor (optional)
            patient_id: Filter by patient (optional)
            start_date: Filter from date (optional)
            end_date: Filter to date (optional)

        Returns:
            AppointmentStatsResponse with statistics
        """
        query = db.query(Appointment)

        if doctor_id:
            query = query.filter(Appointment.doctor_id == doctor_id)
        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)
        if start_date:
            query = query.filter(Appointment.start_time >= start_date)
        if end_date:
            query = query.filter(Appointment.end_time <= end_date)

        now = datetime.now(timezone.utc)
        today = now.date()

        appointments = query.all()

        # Calculate statistics
        stats = AppointmentStatsResponse(
            total_appointments=len(appointments),
            scheduled=len([a for a in appointments if a.status == AppointmentStatus.SCHEDULED]),
            confirmed=len([a for a in appointments if a.status == AppointmentStatus.CONFIRMED]),
            completed=len([a for a in appointments if a.status == AppointmentStatus.COMPLETED]),
            cancelled=len([a for a in appointments if a.status == AppointmentStatus.CANCELLED]),
            no_show=len([a for a in appointments if a.status == AppointmentStatus.NO_SHOW]),
            upcoming_appointments=len([a for a in appointments if a.is_upcoming]),
            past_appointments=len([a for a in appointments if a.is_past]),
            today_appointments=len([
                a for a in appointments
                if a.start_time.date() == today
            ]),
            this_week_appointments=len([
                a for a in appointments
                if today <= a.start_time.date() < today + timedelta(days=7)
            ]),
            this_month_appointments=len([
                a for a in appointments
                if a.start_time.month == now.month and a.start_time.year == now.year
            ]),
        )

        return stats
