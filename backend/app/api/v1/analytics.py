"""
Analytics API Endpoints
API routes for dashboard analytics and statistics
"""

from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.analytics import AnalyticsService
from app.schemas.analytics import (
    GlobalStats,
    ConsultationTimeline,
    ConsultationByType,
    TopDiagnoses,
    AppointmentStats,
    AppointmentTimeline,
    PatientGrowth,
    AgeDistribution,
    PrescriptionStats,
    RecentActivity,
    DashboardData,
    TimelineDataPoint,
    DiagnosisCount,
    ActivityItem
)


router = APIRouter()


# ======================
# Global Statistics
# ======================

@router.get(
    "/analytics/global-stats",
    response_model=GlobalStats,
    summary="Get global dashboard statistics",
    description="Returns global statistics including patient count, consultations, appointments, and prescriptions for a given period"
)
def get_global_statistics(
    start_date: Optional[date] = Query(None, description="Start date (defaults to 30 days ago)"),
    end_date: Optional[date] = Query(None, description="End date (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get global dashboard statistics

    **Includes:**
    - Active patients count
    - Total consultations in period
    - Consultations this month
    - Total appointments in period
    - Upcoming appointments (next 7 days)
    - Total prescriptions in period

    **Query Parameters:**
    - start_date: Filter start date (optional, defaults to 30 days ago)
    - end_date: Filter end date (optional, defaults to today)
    """
    analytics = AnalyticsService(db, current_user.id)
    stats = analytics.get_global_stats(start_date, end_date)
    return GlobalStats(**stats)


# ======================
# Consultation Analytics
# ======================

@router.get(
    "/analytics/consultation-timeline",
    response_model=ConsultationTimeline,
    summary="Get consultation count over time",
    description="Returns consultation counts grouped by day, week, or month"
)
def get_consultation_timeline(
    start_date: Optional[date] = Query(None, description="Start date (defaults to 30 days ago)"),
    end_date: Optional[date] = Query(None, description="End date (defaults to today)"),
    granularity: str = Query("day", regex="^(day|week|month)$", description="Time granularity"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get consultation count timeline

    **Query Parameters:**
    - start_date: Start date (optional)
    - end_date: End date (optional)
    - granularity: Time grouping - "day", "week", or "month" (default: "day")
    """
    analytics = AnalyticsService(db, current_user.id)
    timeline = analytics.get_consultation_timeline(start_date, end_date, granularity)
    return ConsultationTimeline(
        data=[TimelineDataPoint(**item) for item in timeline],
        granularity=granularity
    )


@router.get(
    "/analytics/consultation-by-type",
    response_model=ConsultationByType,
    summary="Get consultation distribution by type",
    description="Returns consultation counts grouped by consultation type"
)
def get_consultation_by_type(
    start_date: Optional[date] = Query(None, description="Start date (defaults to 90 days ago)"),
    end_date: Optional[date] = Query(None, description="End date (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get consultation count by type

    **Returns:**
    - Consultation count for each type (première consultation, suivi, urgence, etc.)

    **Query Parameters:**
    - start_date: Start date (optional, defaults to 90 days ago)
    - end_date: End date (optional, defaults to today)
    """
    analytics = AnalyticsService(db, current_user.id)
    by_type = analytics.get_consultation_by_type(start_date, end_date)
    return ConsultationByType(data=by_type)


# ======================
# Diagnosis Analytics
# ======================

@router.get(
    "/analytics/top-diagnoses",
    response_model=TopDiagnoses,
    summary="Get most frequent diagnoses",
    description="Returns the most common diagnoses with counts and percentages"
)
def get_top_diagnoses(
    limit: int = Query(10, ge=1, le=50, description="Number of top diagnoses to return"),
    start_date: Optional[date] = Query(None, description="Start date (defaults to 90 days ago)"),
    end_date: Optional[date] = Query(None, description="End date (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get top diagnoses

    **Returns:**
    - Most frequent diagnoses with:
      - Diagnosis name
      - Count
      - Percentage of total

    **Query Parameters:**
    - limit: Number of top diagnoses (1-50, default: 10)
    - start_date: Start date (optional, defaults to 90 days ago)
    - end_date: End date (optional, defaults to today)
    """
    analytics = AnalyticsService(db, current_user.id)
    diagnoses = analytics.get_top_diagnoses(limit, start_date, end_date)
    return TopDiagnoses(data=[DiagnosisCount(**item) for item in diagnoses])


# ======================
# Appointment Analytics
# ======================

@router.get(
    "/analytics/appointment-stats",
    response_model=AppointmentStats,
    summary="Get appointment statistics",
    description="Returns appointment counts by status with completion and cancellation rates"
)
def get_appointment_statistics(
    start_date: Optional[date] = Query(None, description="Start date (defaults to 30 days ago)"),
    end_date: Optional[date] = Query(None, description="End date (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get appointment statistics

    **Returns:**
    - Count by status (scheduled, confirmed, completed, cancelled, no_show)
    - Total appointments
    - Completion rate (%)
    - Cancellation rate (%)
    - No-show rate (%)

    **Query Parameters:**
    - start_date: Start date (optional, defaults to 30 days ago)
    - end_date: End date (optional, defaults to today)
    """
    analytics = AnalyticsService(db, current_user.id)
    stats = analytics.get_appointment_stats(start_date, end_date)
    return AppointmentStats(**stats)


@router.get(
    "/analytics/appointment-timeline",
    response_model=AppointmentTimeline,
    summary="Get appointment count over time",
    description="Returns appointment counts by date with status breakdown"
)
def get_appointment_timeline(
    start_date: Optional[date] = Query(None, description="Start date (defaults to 30 days ago)"),
    end_date: Optional[date] = Query(None, description="End date (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get appointment timeline

    **Returns:**
    - Daily appointment counts with breakdown by status:
      - Scheduled
      - Completed
      - Cancelled
      - Total

    **Query Parameters:**
    - start_date: Start date (optional, defaults to 30 days ago)
    - end_date: End date (optional, defaults to today)
    """
    analytics = AnalyticsService(db, current_user.id)
    timeline = analytics.get_appointment_timeline(start_date, end_date)
    return AppointmentTimeline(data=timeline)


# ======================
# Patient Analytics
# ======================

@router.get(
    "/analytics/patient-growth",
    response_model=PatientGrowth,
    summary="Get patient registration growth",
    description="Returns patient registration count over time with cumulative totals"
)
def get_patient_growth(
    start_date: Optional[date] = Query(None, description="Start date (defaults to 90 days ago)"),
    end_date: Optional[date] = Query(None, description="End date (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get patient growth timeline

    **Returns:**
    - Daily patient registration counts
    - Cumulative patient count

    **Query Parameters:**
    - start_date: Start date (optional, defaults to 90 days ago)
    - end_date: End date (optional, defaults to today)
    """
    analytics = AnalyticsService(db, current_user.id)
    growth = analytics.get_patient_growth(start_date, end_date)
    return PatientGrowth(data=growth)


@router.get(
    "/analytics/patient-age-distribution",
    response_model=AgeDistribution,
    summary="Get patient age distribution",
    description="Returns patient count by age groups"
)
def get_patient_age_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get patient age distribution

    **Returns:**
    - Patient count for age groups:
      - 0-17 (pediatric)
      - 18-30 (young adult)
      - 31-45 (adult)
      - 46-60 (middle age)
      - 61+ (senior)
    """
    analytics = AnalyticsService(db, current_user.id)
    distribution = analytics.get_patient_age_distribution()
    return AgeDistribution(data=distribution)


# ======================
# Prescription Analytics
# ======================

@router.get(
    "/analytics/prescription-stats",
    response_model=PrescriptionStats,
    summary="Get prescription statistics",
    description="Returns prescription counts by status and average medications per prescription"
)
def get_prescription_statistics(
    start_date: Optional[date] = Query(None, description="Start date (defaults to 30 days ago)"),
    end_date: Optional[date] = Query(None, description="End date (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get prescription statistics

    **Returns:**
    - Total prescriptions
    - Count by status (active, completed, cancelled)
    - Average medications per prescription

    **Query Parameters:**
    - start_date: Start date (optional, defaults to 30 days ago)
    - end_date: End date (optional, defaults to today)
    """
    analytics = AnalyticsService(db, current_user.id)
    stats = analytics.get_prescription_stats(start_date, end_date)
    return PrescriptionStats(**stats)


# ======================
# Recent Activity
# ======================

@router.get(
    "/analytics/recent-activity",
    response_model=RecentActivity,
    summary="Get recent activity",
    description="Returns recent consultations, appointments, and prescriptions"
)
def get_recent_activity(
    limit: int = Query(10, ge=1, le=50, description="Number of recent items"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get recent activity summary

    **Returns:**
    - Recent consultations, appointments, and prescriptions
    - Sorted by date descending

    **Query Parameters:**
    - limit: Number of items to return (1-50, default: 10)
    """
    analytics = AnalyticsService(db, current_user.id)
    activities = analytics.get_recent_activity(limit)
    return RecentActivity(activities=[ActivityItem(**item) for item in activities])


# ======================
# Complete Dashboard
# ======================

@router.get(
    "/analytics/dashboard",
    response_model=DashboardData,
    summary="Get complete dashboard data",
    description="Returns all dashboard data in a single request (global stats, timeline, diagnoses, appointments, activity)"
)
def get_dashboard_data(
    start_date: Optional[date] = Query(None, description="Start date (defaults to 30 days ago)"),
    end_date: Optional[date] = Query(None, description="End date (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get complete dashboard data

    **This endpoint returns all dashboard metrics in a single request:**
    - Global statistics
    - Consultation timeline
    - Top diagnoses
    - Appointment statistics
    - Recent activity

    **Optimized for dashboard page load** - reduces number of API calls.

    **Query Parameters:**
    - start_date: Start date (optional, defaults to 30 days ago)
    - end_date: End date (optional, defaults to today)
    """
    analytics = AnalyticsService(db, current_user.id)

    # Get all data
    global_stats = analytics.get_global_stats(start_date, end_date)
    timeline = analytics.get_consultation_timeline(start_date, end_date, "day")
    diagnoses = analytics.get_top_diagnoses(10, start_date, end_date)
    appointment_stats = analytics.get_appointment_stats(start_date, end_date)
    activities = analytics.get_recent_activity(10)

    return DashboardData(
        global_stats=GlobalStats(**global_stats),
        consultation_timeline=[TimelineDataPoint(**item) for item in timeline],
        top_diagnoses=[DiagnosisCount(**item) for item in diagnoses],
        appointment_stats=AppointmentStats(**appointment_stats),
        recent_activity=[ActivityItem(**item) for item in activities]
    )
