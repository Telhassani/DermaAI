"""
API v1 endpoints
"""

from app.api.v1 import auth, patients, consultations, prescriptions, images, appointments

__all__ = ["auth", "patients", "consultations", "prescriptions", "images", "appointments"]
