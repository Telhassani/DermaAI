"""
Services module - Business logic layer for DermAI application

This module contains service classes that encapsulate business logic,
separating it from API routes and database models.
"""

from app.services.appointments import AppointmentService

__all__ = ["AppointmentService"]
