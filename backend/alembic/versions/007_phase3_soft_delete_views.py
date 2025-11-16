"""Phase 3: Create database views for soft delete filtering.

Revision ID: 007_phase3_soft_delete_views
Revises: 006_phase3_new_tables
Create Date: 2025-11-16 14:00:00.000000

This migration creates views that automatically filter soft-deleted records
(is_deleted = false), ensuring queries always work with active records by default.
Views follow naming convention: v_<table_name>

Benefits:
- Simplifies queries by filtering soft-deleted records automatically
- Prevents accidental inclusion of deleted records in reports
- Single source of truth for "active record" definition
- Easy to update filter logic globally if needed
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007_phase3_soft_delete_views'
down_revision = '006_phase3_new_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create views for soft delete filtering."""

    # ========================================================================
    # 1. v_users - Active users only (not deleted)
    # ========================================================================
    op.execute("""
        CREATE OR REPLACE VIEW v_users AS
        SELECT * FROM users
        WHERE is_deleted = false
    """)
    print("✓ Created v_users view")

    # ========================================================================
    # 2. v_patients - Active patients only (not deleted)
    # ========================================================================
    op.execute("""
        CREATE OR REPLACE VIEW v_patients AS
        SELECT * FROM patients
        WHERE is_deleted = false
    """)
    print("✓ Created v_patients view")

    # ========================================================================
    # 3. v_appointments - Active appointments only (not deleted)
    # ========================================================================
    op.execute("""
        CREATE OR REPLACE VIEW v_appointments AS
        SELECT * FROM appointments
        WHERE is_deleted = false
    """)
    print("✓ Created v_appointments view")

    # ========================================================================
    # 4. v_consultations - Active consultations only (not deleted)
    # ========================================================================
    op.execute("""
        CREATE OR REPLACE VIEW v_consultations AS
        SELECT * FROM consultations
        WHERE is_deleted = false
    """)
    print("✓ Created v_consultations view")

    # ========================================================================
    # 5. v_prescriptions - Active prescriptions only (not deleted)
    # ========================================================================
    op.execute("""
        CREATE OR REPLACE VIEW v_prescriptions AS
        SELECT * FROM prescriptions
        WHERE is_deleted = false
    """)
    print("✓ Created v_prescriptions view")

    # ========================================================================
    # 6. v_consultation_images - Active images only (not deleted)
    # ========================================================================
    op.execute("""
        CREATE OR REPLACE VIEW v_consultation_images AS
        SELECT * FROM consultation_images
        WHERE is_deleted = false
    """)
    print("✓ Created v_consultation_images view")

    # ========================================================================
    # 7. v_lab_results - Active lab results only (not deleted)
    # ========================================================================
    op.execute("""
        CREATE OR REPLACE VIEW v_lab_results AS
        SELECT * FROM lab_results
        WHERE is_deleted = false
    """)
    print("✓ Created v_lab_results view")

    # ========================================================================
    # 8. v_prescription_medications - Active medications only (not deleted)
    # ========================================================================
    op.execute("""
        CREATE OR REPLACE VIEW v_prescription_medications AS
        SELECT * FROM prescription_medications
        WHERE is_deleted = false
    """)
    print("✓ Created v_prescription_medications view")

    # ========================================================================
    # 9. v_doctor_schedules - Active schedules only (not deleted)
    # ========================================================================
    op.execute("""
        CREATE OR REPLACE VIEW v_doctor_schedules AS
        SELECT * FROM doctor_schedules
        WHERE is_deleted = false
    """)
    print("✓ Created v_doctor_schedules view")

    # ========================================================================
    # 10. v_audit_logs - All audit logs (no soft delete filtering needed)
    # Note: audit_logs should never be deleted for compliance, but we create
    # a view for consistency with other tables
    # ========================================================================
    op.execute("""
        CREATE OR REPLACE VIEW v_audit_logs AS
        SELECT * FROM audit_logs
        ORDER BY timestamp DESC
    """)
    print("✓ Created v_audit_logs view")

    # ========================================================================
    # 11. v_dashboard_stats - View for dashboard aggregations
    # This view counts all active records by type for dashboard widgets
    # ========================================================================
    op.execute("""
        CREATE OR REPLACE VIEW v_dashboard_stats AS
        SELECT
            (SELECT COUNT(*) FROM v_patients) as total_patients,
            (SELECT COUNT(*) FROM v_appointments
             WHERE status = 'SCHEDULED' AND start_time > NOW()) as upcoming_appointments,
            (SELECT COUNT(*) FROM v_appointments
             WHERE status = 'IN_PROGRESS' AND start_time <= NOW() AND end_time > NOW()) as current_appointments,
            (SELECT COUNT(*) FROM v_consultations
             WHERE follow_up_required = true AND follow_up_date <= CURRENT_DATE) as pending_followups,
            (SELECT COUNT(*) FROM v_prescriptions
             WHERE is_delivered = false) as undelivered_prescriptions,
            (SELECT COUNT(*) FROM v_lab_results
             WHERE normal = false) as abnormal_lab_results
    """)
    print("✓ Created v_dashboard_stats view")


def downgrade() -> None:
    """Remove all soft delete views."""

    # Drop views in reverse order of creation
    op.execute("DROP VIEW IF EXISTS v_dashboard_stats")
    op.execute("DROP VIEW IF EXISTS v_audit_logs")
    op.execute("DROP VIEW IF EXISTS v_doctor_schedules")
    op.execute("DROP VIEW IF EXISTS v_prescription_medications")
    op.execute("DROP VIEW IF EXISTS v_lab_results")
    op.execute("DROP VIEW IF EXISTS v_consultation_images")
    op.execute("DROP VIEW IF EXISTS v_prescriptions")
    op.execute("DROP VIEW IF EXISTS v_consultations")
    op.execute("DROP VIEW IF EXISTS v_appointments")
    op.execute("DROP VIEW IF EXISTS v_patients")
    op.execute("DROP VIEW IF EXISTS v_users")

    print("✓ Removed all soft delete views")
