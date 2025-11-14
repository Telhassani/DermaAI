"""
API v1 endpoints
"""

from app.api.v1 import auth, patients, consultations, prescriptions, appointments, consultation_images, analytics

__all__ = ["auth", "patients", "consultations", "prescriptions", "appointments", "consultation_images", "analytics"]
