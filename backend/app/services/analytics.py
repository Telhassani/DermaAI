"""
Analytics Service
Service for calculating dashboard statistics and metrics
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple
from sqlalchemy import func, extract, and_, case
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.appointment import Appointment
from app.models.prescription import Prescription


class AnalyticsService:
    """Service for calculating dashboard analytics and statistics"""

    def __init__(self, db: Session, doctor_id: int):
        self.db = db
        self.doctor_id = doctor_id

    # ======================
    # Global Statistics
    # ======================

    def get_global_stats(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict:
        """
        Calculate global dashboard statistics

        Args:
            start_date: Filter start date (optional)
            end_date: Filter end date (optional)

        Returns:
            Dictionary with global statistics
        """
        # Default to last 30 days if no dates provided
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        # Total active patients
        active_patients = self.db.query(func.count(Patient.id)).filter(
            Patient.doctor_id == self.doctor_id,
            Patient.is_active == True
        ).scalar() or 0

        # Total consultations in period
        consultation_filters = [
            Consultation.doctor_id == self.doctor_id,
            func.date(Consultation.consultation_date) >= start_date,
            func.date(Consultation.consultation_date) <= end_date
        ]
        total_consultations = self.db.query(func.count(Consultation.id)).filter(
            *consultation_filters
        ).scalar() or 0

        # Consultations this month
        month_start = date.today().replace(day=1)
        consultations_this_month = self.db.query(func.count(Consultation.id)).filter(
            Consultation.doctor_id == self.doctor_id,
            func.date(Consultation.consultation_date) >= month_start
        ).scalar() or 0

        # Total appointments in period
        appointment_filters = [
            Appointment.doctor_id == self.doctor_id,
            func.date(Appointment.appointment_date) >= start_date,
            func.date(Appointment.appointment_date) <= end_date
        ]
        total_appointments = self.db.query(func.count(Appointment.id)).filter(
            *appointment_filters
        ).scalar() or 0

        # Upcoming appointments (next 7 days)
        upcoming_appointments = self.db.query(func.count(Appointment.id)).filter(
            Appointment.doctor_id == self.doctor_id,
            Appointment.status.in_(['scheduled', 'confirmed']),
            func.date(Appointment.appointment_date) >= date.today(),
            func.date(Appointment.appointment_date) <= date.today() + timedelta(days=7)
        ).scalar() or 0

        # Total prescriptions in period
        prescription_filters = [
            Prescription.doctor_id == self.doctor_id,
            func.date(Prescription.created_at) >= start_date,
            func.date(Prescription.created_at) <= end_date
        ]
        total_prescriptions = self.db.query(func.count(Prescription.id)).filter(
            *prescription_filters
        ).scalar() or 0

        return {
            "active_patients": active_patients,
            "total_consultations": total_consultations,
            "consultations_this_month": consultations_this_month,
            "total_appointments": total_appointments,
            "upcoming_appointments": upcoming_appointments,
            "total_prescriptions": total_prescriptions,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            }
        }

    # ======================
    # Consultation Analytics
    # ======================

    def get_consultation_timeline(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        granularity: str = "day"  # "day", "week", "month"
    ) -> List[Dict]:
        """
        Get consultation count over time

        Args:
            start_date: Start date
            end_date: End date
            granularity: Time grouping ("day", "week", "month")

        Returns:
            List of {date, count} dictionaries
        """
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        # Build query based on granularity
        if granularity == "day":
            date_column = func.date(Consultation.consultation_date)
        elif granularity == "week":
            # ISO week: year-week format
            date_column = func.strftime('%Y-W%W', Consultation.consultation_date)
        elif granularity == "month":
            date_column = func.strftime('%Y-%m', Consultation.consultation_date)
        else:
            date_column = func.date(Consultation.consultation_date)

        results = self.db.query(
            date_column.label('date'),
            func.count(Consultation.id).label('count')
        ).filter(
            Consultation.doctor_id == self.doctor_id,
            func.date(Consultation.consultation_date) >= start_date,
            func.date(Consultation.consultation_date) <= end_date
        ).group_by('date').order_by('date').all()

        return [
            {"date": str(r.date), "count": r.count}
            for r in results
        ]

    def get_consultation_by_type(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict]:
        """
        Get consultation count by type

        Returns:
            List of {type, count} dictionaries
        """
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=90)

        results = self.db.query(
            Consultation.consultation_type,
            func.count(Consultation.id).label('count')
        ).filter(
            Consultation.doctor_id == self.doctor_id,
            func.date(Consultation.consultation_date) >= start_date,
            func.date(Consultation.consultation_date) <= end_date,
            Consultation.consultation_type.isnot(None)
        ).group_by(Consultation.consultation_type).all()

        return [
            {"type": r.consultation_type, "count": r.count}
            for r in results
        ]

    # ======================
    # Diagnosis Analytics
    # ======================

    def get_top_diagnoses(
        self,
        limit: int = 10,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict]:
        """
        Get most frequent diagnoses

        Args:
            limit: Number of top diagnoses to return
            start_date: Filter start date
            end_date: Filter end date

        Returns:
            List of {diagnosis, count, percentage} dictionaries
        """
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=90)

        # Total consultations with diagnosis
        total = self.db.query(func.count(Consultation.id)).filter(
            Consultation.doctor_id == self.doctor_id,
            func.date(Consultation.consultation_date) >= start_date,
            func.date(Consultation.consultation_date) <= end_date,
            Consultation.diagnosis.isnot(None),
            Consultation.diagnosis != ''
        ).scalar() or 0

        if total == 0:
            return []

        results = self.db.query(
            Consultation.diagnosis,
            func.count(Consultation.id).label('count')
        ).filter(
            Consultation.doctor_id == self.doctor_id,
            func.date(Consultation.consultation_date) >= start_date,
            func.date(Consultation.consultation_date) <= end_date,
            Consultation.diagnosis.isnot(None),
            Consultation.diagnosis != ''
        ).group_by(Consultation.diagnosis).order_by(
            func.count(Consultation.id).desc()
        ).limit(limit).all()

        return [
            {
                "diagnosis": r.diagnosis,
                "count": r.count,
                "percentage": round((r.count / total) * 100, 1)
            }
            for r in results
        ]

    # ======================
    # Appointment Analytics
    # ======================

    def get_appointment_stats(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict:
        """
        Get appointment statistics by status

        Returns:
            Dictionary with appointment counts by status
        """
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        results = self.db.query(
            Appointment.status,
            func.count(Appointment.id).label('count')
        ).filter(
            Appointment.doctor_id == self.doctor_id,
            func.date(Appointment.appointment_date) >= start_date,
            func.date(Appointment.appointment_date) <= end_date
        ).group_by(Appointment.status).all()

        stats = {r.status: r.count for r in results}

        # Calculate rates
        total = sum(stats.values())
        completed = stats.get('completed', 0)
        cancelled = stats.get('cancelled', 0)
        no_show = stats.get('no_show', 0)

        return {
            "by_status": stats,
            "total": total,
            "completion_rate": round((completed / total * 100), 1) if total > 0 else 0,
            "cancellation_rate": round((cancelled / total * 100), 1) if total > 0 else 0,
            "no_show_rate": round((no_show / total * 100), 1) if total > 0 else 0
        }

    def get_appointment_timeline(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict]:
        """
        Get appointment count over time

        Returns:
            List of {date, scheduled, completed, cancelled} dictionaries
        """
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        results = self.db.query(
            func.date(Appointment.appointment_date).label('date'),
            func.count(case((Appointment.status == 'scheduled', 1))).label('scheduled'),
            func.count(case((Appointment.status == 'completed', 1))).label('completed'),
            func.count(case((Appointment.status == 'cancelled', 1))).label('cancelled'),
            func.count(Appointment.id).label('total')
        ).filter(
            Appointment.doctor_id == self.doctor_id,
            func.date(Appointment.appointment_date) >= start_date,
            func.date(Appointment.appointment_date) <= end_date
        ).group_by('date').order_by('date').all()

        return [
            {
                "date": str(r.date),
                "scheduled": r.scheduled,
                "completed": r.completed,
                "cancelled": r.cancelled,
                "total": r.total
            }
            for r in results
        ]

    # ======================
    # Patient Analytics
    # ======================

    def get_patient_growth(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict]:
        """
        Get patient registration growth over time

        Returns:
            List of {date, count, cumulative} dictionaries
        """
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=90)

        results = self.db.query(
            func.date(Patient.created_at).label('date'),
            func.count(Patient.id).label('count')
        ).filter(
            Patient.doctor_id == self.doctor_id,
            func.date(Patient.created_at) >= start_date,
            func.date(Patient.created_at) <= end_date
        ).group_by('date').order_by('date').all()

        # Calculate cumulative
        cumulative = 0
        timeline = []
        for r in results:
            cumulative += r.count
            timeline.append({
                "date": str(r.date),
                "count": r.count,
                "cumulative": cumulative
            })

        return timeline

    def get_patient_age_distribution(self) -> List[Dict]:
        """
        Get patient count by age groups

        Returns:
            List of {age_group, count} dictionaries
        """
        # Age groups: 0-17, 18-30, 31-45, 46-60, 61+
        today = date.today()

        results = self.db.query(
            case(
                (extract('year', today) - extract('year', Patient.date_of_birth) < 18, '0-17'),
                (extract('year', today) - extract('year', Patient.date_of_birth) < 31, '18-30'),
                (extract('year', today) - extract('year', Patient.date_of_birth) < 46, '31-45'),
                (extract('year', today) - extract('year', Patient.date_of_birth) < 61, '46-60'),
                else_='61+'
            ).label('age_group'),
            func.count(Patient.id).label('count')
        ).filter(
            Patient.doctor_id == self.doctor_id,
            Patient.is_active == True,
            Patient.date_of_birth.isnot(None)
        ).group_by('age_group').all()

        return [
            {"age_group": r.age_group, "count": r.count}
            for r in results
        ]

    # ======================
    # Prescription Analytics
    # ======================

    def get_prescription_stats(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict:
        """
        Get prescription statistics

        Returns:
            Dictionary with prescription metrics
        """
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        # Total prescriptions
        total = self.db.query(func.count(Prescription.id)).filter(
            Prescription.doctor_id == self.doctor_id,
            func.date(Prescription.created_at) >= start_date,
            func.date(Prescription.created_at) <= end_date
        ).scalar() or 0

        # By status
        by_status = self.db.query(
            Prescription.status,
            func.count(Prescription.id).label('count')
        ).filter(
            Prescription.doctor_id == self.doctor_id,
            func.date(Prescription.created_at) >= start_date,
            func.date(Prescription.created_at) <= end_date
        ).group_by(Prescription.status).all()

        status_dict = {r.status: r.count for r in by_status}

        # Average medications per prescription
        avg_medications = self.db.query(
            func.avg(func.json_array_length(Prescription.medications))
        ).filter(
            Prescription.doctor_id == self.doctor_id,
            func.date(Prescription.created_at) >= start_date,
            func.date(Prescription.created_at) <= end_date,
            Prescription.medications.isnot(None)
        ).scalar()

        return {
            "total": total,
            "by_status": status_dict,
            "average_medications": round(float(avg_medications or 0), 1)
        }

    # ======================
    # Activity Summary
    # ======================

    def get_recent_activity(self, limit: int = 10) -> List[Dict]:
        """
        Get recent activity summary (consultations, appointments, prescriptions)

        Args:
            limit: Number of recent items to return

        Returns:
            List of activity dictionaries sorted by date
        """
        activities = []

        # Recent consultations
        consultations = self.db.query(Consultation).filter(
            Consultation.doctor_id == self.doctor_id
        ).order_by(Consultation.consultation_date.desc()).limit(limit).all()

        for c in consultations:
            activities.append({
                "type": "consultation",
                "id": c.id,
                "patient_id": c.patient_id,
                "patient_name": f"{c.patient.first_name} {c.patient.last_name}",
                "date": c.consultation_date.isoformat(),
                "description": f"Consultation: {c.chief_complaint or 'N/A'}"
            })

        # Recent appointments
        appointments = self.db.query(Appointment).filter(
            Appointment.doctor_id == self.doctor_id
        ).order_by(Appointment.appointment_date.desc()).limit(limit).all()

        for a in appointments:
            activities.append({
                "type": "appointment",
                "id": a.id,
                "patient_id": a.patient_id,
                "patient_name": f"{a.patient.first_name} {a.patient.last_name}",
                "date": a.appointment_date.isoformat(),
                "description": f"RDV {a.appointment_type or ''} - {a.status}"
            })

        # Recent prescriptions
        prescriptions = self.db.query(Prescription).filter(
            Prescription.doctor_id == self.doctor_id
        ).order_by(Prescription.created_at.desc()).limit(limit).all()

        for p in prescriptions:
            activities.append({
                "type": "prescription",
                "id": p.id,
                "patient_id": p.patient_id,
                "patient_name": f"{p.patient.first_name} {p.patient.last_name}",
                "date": p.created_at.isoformat(),
                "description": f"Ordonnance - {p.status}"
            })

        # Sort by date descending and limit
        activities.sort(key=lambda x: x['date'], reverse=True)
        return activities[:limit]
