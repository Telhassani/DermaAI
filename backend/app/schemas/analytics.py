"""
Analytics Schemas
Pydantic schemas for dashboard analytics and statistics responses
"""

from datetime import date
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


# ======================
# Global Statistics
# ======================

class PeriodInfo(BaseModel):
    """Date period information"""
    start_date: str = Field(..., description="Start date (ISO format)")
    end_date: str = Field(..., description="End date (ISO format)")
    days: int = Field(..., description="Number of days in period")


class GlobalStats(BaseModel):
    """Global dashboard statistics"""
    active_patients: int = Field(..., description="Total active patients")
    total_consultations: int = Field(..., description="Consultations in period")
    consultations_this_month: int = Field(..., description="Consultations this month")
    total_appointments: int = Field(..., description="Appointments in period")
    upcoming_appointments: int = Field(..., description="Upcoming appointments (next 7 days)")
    total_prescriptions: int = Field(..., description="Prescriptions in period")
    period: PeriodInfo = Field(..., description="Period information")

    class Config:
        json_schema_extra = {
            "example": {
                "active_patients": 150,
                "total_consultations": 45,
                "consultations_this_month": 32,
                "total_appointments": 67,
                "upcoming_appointments": 12,
                "total_prescriptions": 38,
                "period": {
                    "start_date": "2025-10-15",
                    "end_date": "2025-11-14",
                    "days": 31
                }
            }
        }


# ======================
# Timeline Data
# ======================

class TimelineDataPoint(BaseModel):
    """Single data point in timeline"""
    date: str = Field(..., description="Date (ISO format or year-week/year-month)")
    count: int = Field(..., description="Count for this date")


class ConsultationTimeline(BaseModel):
    """Consultation count over time"""
    data: List[TimelineDataPoint] = Field(..., description="Timeline data points")
    granularity: str = Field(..., description="Time granularity (day/week/month)")

    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {"date": "2025-11-01", "count": 5},
                    {"date": "2025-11-02", "count": 8},
                    {"date": "2025-11-03", "count": 3}
                ],
                "granularity": "day"
            }
        }


class AppointmentTimelineDataPoint(BaseModel):
    """Appointment timeline data point with status breakdown"""
    date: str = Field(..., description="Date (ISO format)")
    scheduled: int = Field(..., description="Scheduled appointments")
    completed: int = Field(..., description="Completed appointments")
    cancelled: int = Field(..., description="Cancelled appointments")
    total: int = Field(..., description="Total appointments")


class AppointmentTimeline(BaseModel):
    """Appointment count over time with status breakdown"""
    data: List[AppointmentTimelineDataPoint] = Field(..., description="Timeline data points")

    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {
                        "date": "2025-11-01",
                        "scheduled": 3,
                        "completed": 5,
                        "cancelled": 1,
                        "total": 9
                    }
                ]
            }
        }


# ======================
# Distribution Data
# ======================

class CategoryCount(BaseModel):
    """Generic category with count"""
    type: str = Field(..., description="Category type")
    count: int = Field(..., description="Count for this category")


class ConsultationByType(BaseModel):
    """Consultation distribution by type"""
    data: List[CategoryCount] = Field(..., description="Consultation counts by type")

    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {"type": "première consultation", "count": 25},
                    {"type": "suivi", "count": 42},
                    {"type": "urgence", "count": 8}
                ]
            }
        }


class DiagnosisCount(BaseModel):
    """Diagnosis with count and percentage"""
    diagnosis: str = Field(..., description="Diagnosis name")
    count: int = Field(..., description="Number of occurrences")
    percentage: float = Field(..., description="Percentage of total")


class TopDiagnoses(BaseModel):
    """Top frequent diagnoses"""
    data: List[DiagnosisCount] = Field(..., description="Top diagnoses with counts")

    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {"diagnosis": "Eczéma atopique", "count": 15, "percentage": 18.5},
                    {"diagnosis": "Psoriasis", "count": 12, "percentage": 14.8},
                    {"diagnosis": "Acné", "count": 10, "percentage": 12.3}
                ]
            }
        }


# ======================
# Appointment Statistics
# ======================

class AppointmentStats(BaseModel):
    """Appointment statistics with rates"""
    by_status: Dict[str, int] = Field(..., description="Count by status")
    total: int = Field(..., description="Total appointments")
    completion_rate: float = Field(..., description="Completion rate (%)")
    cancellation_rate: float = Field(..., description="Cancellation rate (%)")
    no_show_rate: float = Field(..., description="No-show rate (%)")

    class Config:
        json_schema_extra = {
            "example": {
                "by_status": {
                    "scheduled": 12,
                    "confirmed": 8,
                    "completed": 35,
                    "cancelled": 5,
                    "no_show": 3
                },
                "total": 63,
                "completion_rate": 55.6,
                "cancellation_rate": 7.9,
                "no_show_rate": 4.8
            }
        }


# ======================
# Patient Analytics
# ======================

class PatientGrowthDataPoint(BaseModel):
    """Patient growth data point"""
    date: str = Field(..., description="Date (ISO format)")
    count: int = Field(..., description="New patients on this date")
    cumulative: int = Field(..., description="Cumulative patient count")


class PatientGrowth(BaseModel):
    """Patient registration growth over time"""
    data: List[PatientGrowthDataPoint] = Field(..., description="Growth data points")

    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {"date": "2025-11-01", "count": 3, "cumulative": 145},
                    {"date": "2025-11-02", "count": 2, "cumulative": 147},
                    {"date": "2025-11-03", "count": 5, "cumulative": 152}
                ]
            }
        }


class AgeDistributionDataPoint(BaseModel):
    """Age distribution data point"""
    age_group: str = Field(..., description="Age group")
    count: int = Field(..., description="Patient count")


class AgeDistribution(BaseModel):
    """Patient count by age groups"""
    data: List[AgeDistributionDataPoint] = Field(..., description="Age distribution data")

    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {"age_group": "0-17", "count": 12},
                    {"age_group": "18-30", "count": 35},
                    {"age_group": "31-45", "count": 48},
                    {"age_group": "46-60", "count": 32},
                    {"age_group": "61+", "count": 23}
                ]
            }
        }


# ======================
# Prescription Statistics
# ======================

class PrescriptionStats(BaseModel):
    """Prescription statistics"""
    total: int = Field(..., description="Total prescriptions")
    by_status: Dict[str, int] = Field(..., description="Count by status")
    average_medications: float = Field(..., description="Average medications per prescription")

    class Config:
        json_schema_extra = {
            "example": {
                "total": 45,
                "by_status": {
                    "active": 32,
                    "completed": 10,
                    "cancelled": 3
                },
                "average_medications": 2.3
            }
        }


# ======================
# Recent Activity
# ======================

class ActivityItem(BaseModel):
    """Recent activity item"""
    type: str = Field(..., description="Activity type (consultation/appointment/prescription)")
    id: int = Field(..., description="Entity ID")
    patient_id: int = Field(..., description="Patient ID")
    patient_name: str = Field(..., description="Patient name")
    date: str = Field(..., description="Activity date (ISO format)")
    description: str = Field(..., description="Activity description")


class RecentActivity(BaseModel):
    """Recent activity summary"""
    activities: List[ActivityItem] = Field(..., description="Recent activity items")

    class Config:
        json_schema_extra = {
            "example": {
                "activities": [
                    {
                        "type": "consultation",
                        "id": 123,
                        "patient_id": 45,
                        "patient_name": "Marie Dupont",
                        "date": "2025-11-14T10:30:00",
                        "description": "Consultation: Éruption cutanée"
                    }
                ]
            }
        }


# ======================
# Dashboard Response
# ======================

class DashboardData(BaseModel):
    """Complete dashboard data"""
    global_stats: GlobalStats = Field(..., description="Global statistics")
    consultation_timeline: List[TimelineDataPoint] = Field(..., description="Consultation timeline")
    top_diagnoses: List[DiagnosisCount] = Field(..., description="Top diagnoses")
    appointment_stats: AppointmentStats = Field(..., description="Appointment statistics")
    recent_activity: List[ActivityItem] = Field(..., description="Recent activity")

    class Config:
        json_schema_extra = {
            "example": {
                "global_stats": {
                    "active_patients": 150,
                    "total_consultations": 45,
                    "consultations_this_month": 32,
                    "total_appointments": 67,
                    "upcoming_appointments": 12,
                    "total_prescriptions": 38,
                    "period": {
                        "start_date": "2025-10-15",
                        "end_date": "2025-11-14",
                        "days": 31
                    }
                },
                "consultation_timeline": [
                    {"date": "2025-11-01", "count": 5}
                ],
                "top_diagnoses": [
                    {"diagnosis": "Eczéma", "count": 15, "percentage": 18.5}
                ],
                "appointment_stats": {
                    "by_status": {"completed": 35},
                    "total": 63,
                    "completion_rate": 55.6,
                    "cancellation_rate": 7.9,
                    "no_show_rate": 4.8
                },
                "recent_activity": []
            }
        }
