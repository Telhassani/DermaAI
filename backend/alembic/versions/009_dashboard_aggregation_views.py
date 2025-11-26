"""Phase 3: Create dashboard aggregation views for KPIs and analytics.

Revision ID: 009_dashboard_aggregation_views
Revises: 008_image_storage_refactor
Create Date: 2025-11-16 15:00:00.000000

This migration creates comprehensive materialized and regular views for the
admin/doctor dashboards. Provides real-time KPIs, analytics, and business
metrics without requiring complex queries in the application layer.

Views Created:
1. v_dashboard_stats - Overall system KPIs (already exists, enhanced)
2. v_doctor_patient_count - Patients per doctor
3. v_doctor_appointment_stats - Appointment metrics by doctor
4. v_doctor_consultation_stats - Consultation metrics by doctor
5. v_patient_appointment_history - Recent appointments per patient
6. v_patient_consultation_history - Recent consultations per patient
7. v_appointment_status_breakdown - Appointments grouped by status
8. v_prescription_delivery_status - Prescription delivery metrics
9. v_lab_results_summary - Lab results analysis by patient
10. v_pending_followups - Consultations requiring follow-up
11. v_doctor_workload - Appointments per doctor for workload tracking
12. v_system_health_metrics - Overall system health indicators
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '009_dashboard_aggregation_views'
down_revision = '008_image_storage_refactor'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create dashboard aggregation views."""

    # ========================================================================
    # 1. v_doctor_patient_count - Patient count per doctor
    # ========================================================================
    op.execute("DROP VIEW IF EXISTS v_doctor_patient_count")
    op.execute("""
        CREATE VIEW v_doctor_patient_count AS
        SELECT
            u.id as doctor_id,
            u.full_name as doctor_name,
            u.email as doctor_email,
            COUNT(DISTINCT p.id) as total_patients,
            COUNT(DISTINCT CASE WHEN p.is_deleted = false THEN p.id END) as active_patients,
            MAX(p.updated_at) as last_patient_update
        FROM v_users u
        LEFT JOIN v_patients p ON u.id = p.doctor_id
        WHERE u.role = 'DOCTOR'
        GROUP BY u.id, u.full_name, u.email
        ORDER BY total_patients DESC
    """)
    print("✓ Created v_doctor_patient_count view")

    # ========================================================================
    # 2. v_doctor_appointment_stats - Appointment statistics by doctor
    # ========================================================================
    op.execute("DROP VIEW IF EXISTS v_doctor_appointment_stats")
    op.execute("""
        CREATE VIEW v_doctor_appointment_stats AS
        SELECT
            u.id as doctor_id,
            u.full_name as doctor_name,
            COUNT(DISTINCT a.id) as total_appointments,
            COUNT(DISTINCT CASE WHEN a.status = 'SCHEDULED' THEN a.id END) as scheduled_count,
            COUNT(DISTINCT CASE WHEN a.status = 'CONFIRMED' THEN a.id END) as confirmed_count,
            COUNT(DISTINCT CASE WHEN a.status = 'IN_PROGRESS' THEN a.id END) as in_progress_count,
            COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN a.id END) as completed_count,
            COUNT(DISTINCT CASE WHEN a.status = 'CANCELLED' THEN a.id END) as cancelled_count,
            COUNT(DISTINCT CASE WHEN a.status = 'NO_SHOW' THEN a.id END) as no_show_count,
            COUNT(DISTINCT CASE WHEN a.start_time > datetime('now') AND a.status = 'SCHEDULED' THEN a.id END) as upcoming_appointments,
            ROUND(AVG((strftime('%s', a.end_time) - strftime('%s', a.start_time))/60.0), 1) as avg_appointment_duration_minutes
        FROM v_users u
        LEFT JOIN v_appointments a ON u.id = a.doctor_id
        WHERE u.role = 'DOCTOR'
        GROUP BY u.id, u.full_name
        ORDER BY total_appointments DESC
    """)
    print("✓ Created v_doctor_appointment_stats view")

    # ========================================================================
    # 3. v_doctor_consultation_stats - Consultation statistics by doctor
    # ========================================================================
    op.execute("DROP VIEW IF EXISTS v_doctor_consultation_stats")
    op.execute("""
        CREATE VIEW v_doctor_consultation_stats AS
        SELECT
            u.id as doctor_id,
            u.full_name as doctor_name,
            COUNT(DISTINCT c.id) as total_consultations,
            COUNT(DISTINCT CASE WHEN c.follow_up_required = true THEN c.id END) as follow_up_required_count,
            COUNT(DISTINCT CASE WHEN c.follow_up_required = true AND c.follow_up_date <= date('now')
                THEN c.id END) as overdue_followup_count,
            COUNT(DISTINCT ci.id) as total_images,
            COUNT(DISTINCT p.id) as unique_patients,
            MAX(c.consultation_date) as last_consultation_date
        FROM v_users u
        LEFT JOIN v_consultations c ON u.id = c.doctor_id
        LEFT JOIN v_consultation_images ci ON c.id = ci.consultation_id
        LEFT JOIN v_patients p ON c.patient_id = p.id
        WHERE u.role = 'DOCTOR'
        GROUP BY u.id, u.full_name
        ORDER BY total_consultations DESC
    """)
    print("✓ Created v_doctor_consultation_stats view")

    # ========================================================================
    # 4. v_patient_appointment_history - Recent appointments per patient
    # ========================================================================
    op.execute("DROP VIEW IF EXISTS v_patient_appointment_history")
    op.execute("""
        CREATE VIEW v_patient_appointment_history AS
        SELECT
            p.id as patient_id,
            p.first_name || ' ' || p.last_name as patient_name,
            p.doctor_id,
            u.full_name as doctor_name,
            a.id as appointment_id,
            a.status as appointment_status,
            a.start_time,
            a.end_time,
            ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY a.start_time DESC) as recency_rank
        FROM v_patients p
        LEFT JOIN v_users u ON p.doctor_id = u.id
        LEFT JOIN v_appointments a ON p.id = a.patient_id
        WHERE a.id IS NOT NULL
        ORDER BY p.id, a.start_time DESC
    """)
    print("✓ Created v_patient_appointment_history view")

    # ========================================================================
    # 5. v_patient_consultation_history - Recent consultations per patient
    # ========================================================================
    op.execute("DROP VIEW IF EXISTS v_patient_consultation_history")
    op.execute("""
        CREATE VIEW v_patient_consultation_history AS
        SELECT
            p.id as patient_id,
            p.first_name || ' ' || p.last_name as patient_name,
            p.doctor_id,
            u.full_name as doctor_name,
            c.id as consultation_id,
            c.consultation_date,
            c.follow_up_required,
            c.follow_up_date,
            c.diagnosis,
            COUNT(DISTINCT ci.id) as image_count,
            ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY c.consultation_date DESC) as recency_rank
        FROM v_patients p
        LEFT JOIN v_users u ON p.doctor_id = u.id
        LEFT JOIN v_consultations c ON p.id = c.patient_id
        LEFT JOIN v_consultation_images ci ON c.id = ci.consultation_id
        WHERE c.id IS NOT NULL
        GROUP BY p.id, p.first_name, p.last_name, p.doctor_id, u.full_name,
                 c.id, c.consultation_date, c.follow_up_required, c.follow_up_date, c.diagnosis
        ORDER BY p.id, c.consultation_date DESC
    """)
    print("✓ Created v_patient_consultation_history view")

    # ========================================================================
    # 6. v_appointment_status_breakdown - Appointments by status
    # ========================================================================
    op.execute("DROP VIEW IF EXISTS v_appointment_status_breakdown")
    op.execute("""
        CREATE VIEW v_appointment_status_breakdown AS
        SELECT
            a.status,
            COUNT(*) as count,
            ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage,
            COUNT(DISTINCT a.doctor_id) as doctor_count,
            COUNT(DISTINCT a.patient_id) as patient_count
        FROM v_appointments a
        GROUP BY a.status
        ORDER BY count DESC
    """)
    print("✓ Created v_appointment_status_breakdown view")

    # ========================================================================
    # 7. v_prescription_delivery_status - Prescription delivery metrics
    # ========================================================================
    op.execute("DROP VIEW IF EXISTS v_prescription_delivery_status")
    op.execute("""
        CREATE VIEW v_prescription_delivery_status AS
        SELECT
            CASE WHEN pr.is_delivered = true THEN 'Delivered' ELSE 'Pending Delivery' END as status,
            COUNT(*) as count,
            COUNT(DISTINCT pr.patient_id) as patient_count,
            COUNT(DISTINCT pr.doctor_id) as doctor_count,
            MIN(pr.created_at) as oldest_prescription,
            MAX(pr.created_at) as newest_prescription,
            ROUND(AVG((strftime('%s', datetime('now')) - strftime('%s', pr.created_at))/86400.0), 1) as avg_age_days
        FROM v_prescriptions pr
        GROUP BY pr.is_delivered
        ORDER BY count DESC
    """)
    print("✓ Created v_prescription_delivery_status view")

    # ========================================================================
    # 8. v_lab_results_summary - Lab results analysis
    # ========================================================================
    op.execute("DROP VIEW IF EXISTS v_lab_results_summary")
    op.execute("""
        CREATE VIEW v_lab_results_summary AS
        SELECT
            lr.patient_id,
            p.first_name || ' ' || p.last_name as patient_name,
            COUNT(*) as total_tests,
            COUNT(CASE WHEN lr.normal = true THEN 1 END) as normal_results,
            COUNT(CASE WHEN lr.normal = false THEN 1 END) as abnormal_results,
            COUNT(CASE WHEN lr.normal IS NULL THEN 1 END) as pending_results,
            GROUP_CONCAT(DISTINCT lr.test_name) as test_types,
            MAX(lr.test_date) as latest_test_date
        FROM v_lab_results lr
        LEFT JOIN v_patients p ON lr.patient_id = p.id
        GROUP BY lr.patient_id, p.first_name, p.last_name
        ORDER BY abnormal_results DESC, total_tests DESC
    """)
    print("✓ Created v_lab_results_summary view")

    # ========================================================================
    # 9. v_pending_followups - Consultations requiring follow-up
    # ========================================================================
    op.execute("DROP VIEW IF EXISTS v_pending_followups")
    op.execute("""
        CREATE VIEW v_pending_followups AS
        SELECT
            c.id as consultation_id,
            c.patient_id,
            p.first_name || ' ' || p.last_name as patient_name,
            p.phone as patient_phone,
            p.email as patient_email,
            c.doctor_id,
            u.full_name as doctor_name,
            c.follow_up_date,
            CASE WHEN c.follow_up_date <= date('now') THEN 'OVERDUE'
                 WHEN c.follow_up_date <= date('now', '+7 days') THEN 'DUE_SOON'
                 ELSE 'SCHEDULED'
            END as urgency,
            c.diagnosis,
            (julianday(c.follow_up_date) - julianday(date('now'))) as days_until_followup
        FROM v_consultations c
        LEFT JOIN v_patients p ON c.patient_id = p.id
        LEFT JOIN v_users u ON c.doctor_id = u.id
        WHERE c.follow_up_required = true
            AND c.follow_up_date IS NOT NULL
        ORDER BY c.follow_up_date ASC
    """)
    print("✓ Created v_pending_followups view")

    # ========================================================================
    # 10. v_doctor_workload - Workload metrics for scheduling
    # ========================================================================
    op.execute("DROP VIEW IF EXISTS v_doctor_workload")
    op.execute("""
        CREATE VIEW v_doctor_workload AS
        SELECT
            u.id as doctor_id,
            u.full_name as doctor_name,
            DATE(a.start_time) as appointment_date,
            COUNT(*) as appointments_today,
            MIN(TIME(a.start_time)) as first_appointment,
            MAX(TIME(a.end_time)) as last_appointment,
            ROUND(SUM((strftime('%s', a.end_time) - strftime('%s', a.start_time))/3600.0), 1) as total_hours,
            COUNT(DISTINCT a.patient_id) as unique_patients
        FROM v_users u
        LEFT JOIN v_appointments a ON u.id = a.doctor_id
            AND a.status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED')
            AND DATE(a.start_time) >= date('now')
        WHERE u.role = 'DOCTOR'
        GROUP BY u.id, u.full_name, DATE(a.start_time)
        ORDER BY appointment_date DESC, doctor_id
    """)
    print("✓ Created v_doctor_workload view")

    # ========================================================================
    # 11. v_system_health_metrics - Overall system health
    # ========================================================================
    op.execute("DROP VIEW IF EXISTS v_system_health_metrics")
    op.execute("""
        CREATE VIEW v_system_health_metrics AS
        SELECT
            (SELECT COUNT(*) FROM v_users WHERE role = 'DOCTOR') as total_doctors,
            (SELECT COUNT(*) FROM v_patients) as total_patients,
            (SELECT COUNT(*) FROM v_appointments WHERE status IN ('SCHEDULED', 'CONFIRMED')) as pending_appointments,
            (SELECT COUNT(*) FROM v_consultations WHERE follow_up_required = true
                AND follow_up_date <= date('now')) as overdue_followups,
            (SELECT COUNT(*) FROM v_prescriptions WHERE is_delivered = false) as undelivered_prescriptions,
            (SELECT COUNT(*) FROM v_lab_results WHERE normal = false) as abnormal_lab_results,
            (SELECT COUNT(*) FROM v_appointments
                WHERE status = 'NO_SHOW' AND start_time >= date('now', '-30 days')) as no_shows_this_month,
            (SELECT COUNT(*) FROM audit_logs WHERE timestamp >= date('now')) as audit_events_today,
            datetime('now') as last_updated
    """)
    print("✓ Created v_system_health_metrics view")


def downgrade() -> None:
    """Remove all dashboard aggregation views."""

    op.execute("DROP VIEW IF EXISTS v_system_health_metrics")
    op.execute("DROP VIEW IF EXISTS v_doctor_workload")
    op.execute("DROP VIEW IF EXISTS v_pending_followups")
    op.execute("DROP VIEW IF EXISTS v_lab_results_summary")
    op.execute("DROP VIEW IF EXISTS v_prescription_delivery_status")
    op.execute("DROP VIEW IF EXISTS v_appointment_status_breakdown")
    op.execute("DROP VIEW IF EXISTS v_patient_consultation_history")
    op.execute("DROP VIEW IF EXISTS v_patient_appointment_history")
    op.execute("DROP VIEW IF EXISTS v_doctor_consultation_stats")
    op.execute("DROP VIEW IF EXISTS v_doctor_appointment_stats")
    op.execute("DROP VIEW IF EXISTS v_doctor_patient_count")

    print("✓ Removed all dashboard aggregation views")
