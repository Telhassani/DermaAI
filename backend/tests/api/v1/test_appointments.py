"""
Tests for appointment endpoints
"""

import pytest
from datetime import datetime, timedelta, date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.patient import Patient, Gender, IdentificationType
from app.models.user import User, UserRole
from app.core.security import get_password_hash


# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create test database"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create test client"""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    from app.db.session import get_db
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db):
    """Create test user (doctor)"""
    user = User(
        email="test@doctor.com",
        full_name="Test Doctor",
        hashed_password=get_password_hash("Test123!"),
        role=UserRole.DOCTOR,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_patient(db, test_user):
    """Create test patient"""
    patient = Patient(
        identification_type=IdentificationType.CIN,
        identification_number="ABC123",
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1990, 1, 1),
        gender=Gender.MALE,
        phone="0612345678",
        doctor_id=test_user.id,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@pytest.fixture(scope="function")
def auth_headers(client, test_user, db):
    """Get authentication headers"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "Test123!"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestAppointmentCreation:
    """Test appointment creation"""

    def test_create_appointment_success(self, client, db, test_patient, test_user, auth_headers):
        """Test successful appointment creation"""
        start_time = datetime.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        appointment_data = {
            "patient_id": test_patient.id,
            "doctor_id": test_user.id,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "type": AppointmentType.CONSULTATION.value,
            "reason": "Test consultation",
            "is_first_visit": True,
        }

        response = client.post(
            "/api/v1/appointments",
            json=appointment_data,
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["patient_id"] == test_patient.id
        assert data["doctor_id"] == test_user.id
        assert data["type"] == AppointmentType.CONSULTATION.value
        assert data["status"] == AppointmentStatus.SCHEDULED.value
        assert data["is_first_visit"] is True

    def test_create_appointment_invalid_patient(self, client, test_user, auth_headers):
        """Test appointment creation with invalid patient"""
        start_time = datetime.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=1)

        appointment_data = {
            "patient_id": 99999,  # Non-existent patient
            "doctor_id": test_user.id,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "type": AppointmentType.CONSULTATION.value,
        }

        response = client.post(
            "/api/v1/appointments",
            json=appointment_data,
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert "n'existe pas" in response.json()["detail"]

    def test_create_appointment_conflict(self, client, db, test_patient, test_user, auth_headers):
        """Test appointment creation with time conflict"""
        # Create first appointment
        start_time = datetime.now() + timedelta(days=1, hours=10)
        end_time = start_time + timedelta(hours=1)

        appointment1 = Appointment(
            patient_id=test_patient.id,
            doctor_id=test_user.id,
            start_time=start_time,
            end_time=end_time,
            type=AppointmentType.CONSULTATION,
            status=AppointmentStatus.SCHEDULED,
        )
        db.add(appointment1)
        db.commit()

        # Try to create overlapping appointment
        appointment_data = {
            "patient_id": test_patient.id,
            "doctor_id": test_user.id,
            "start_time": (start_time + timedelta(minutes=30)).isoformat(),
            "end_time": (end_time + timedelta(minutes=30)).isoformat(),
            "type": AppointmentType.CONSULTATION.value,
        }

        response = client.post(
            "/api/v1/appointments",
            json=appointment_data,
            headers=auth_headers,
        )

        assert response.status_code == 409
        assert "Conflit" in response.json()["detail"]


class TestAppointmentRetrieval:
    """Test appointment retrieval"""

    def test_list_appointments(self, client, db, test_patient, test_user, auth_headers):
        """Test listing appointments"""
        # Create test appointments
        for i in range(3):
            appointment = Appointment(
                patient_id=test_patient.id,
                doctor_id=test_user.id,
                start_time=datetime.now() + timedelta(days=i+1),
                end_time=datetime.now() + timedelta(days=i+1, hours=1),
                type=AppointmentType.CONSULTATION,
                status=AppointmentStatus.SCHEDULED,
            )
            db.add(appointment)
        db.commit()

        response = client.get(
            "/api/v1/appointments",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 3
        assert len(data["appointments"]) >= 3

    def test_get_appointment_by_id(self, client, db, test_patient, test_user, auth_headers):
        """Test getting appointment by ID"""
        appointment = Appointment(
            patient_id=test_patient.id,
            doctor_id=test_user.id,
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=1),
            type=AppointmentType.CONSULTATION,
            status=AppointmentStatus.SCHEDULED,
            reason="Test reason",
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)

        response = client.get(
            f"/api/v1/appointments/{appointment.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == appointment.id
        assert data["reason"] == "Test reason"

    def test_filter_appointments_by_date(self, client, db, test_patient, test_user, auth_headers):
        """Test filtering appointments by date"""
        # Create appointments on different dates
        tomorrow = datetime.now() + timedelta(days=1)
        next_week = datetime.now() + timedelta(days=7)

        appointment1 = Appointment(
            patient_id=test_patient.id,
            doctor_id=test_user.id,
            start_time=tomorrow,
            end_time=tomorrow + timedelta(hours=1),
            type=AppointmentType.CONSULTATION,
        )
        appointment2 = Appointment(
            patient_id=test_patient.id,
            doctor_id=test_user.id,
            start_time=next_week,
            end_time=next_week + timedelta(hours=1),
            type=AppointmentType.FOLLOW_UP,
        )
        db.add_all([appointment1, appointment2])
        db.commit()

        # Filter by date range (only tomorrow)
        response = client.get(
            "/api/v1/appointments",
            params={
                "start_date": tomorrow.replace(hour=0, minute=0).isoformat(),
                "end_date": tomorrow.replace(hour=23, minute=59).isoformat(),
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1


class TestAppointmentUpdate:
    """Test appointment update"""

    def test_update_appointment(self, client, db, test_patient, test_user, auth_headers):
        """Test updating appointment"""
        appointment = Appointment(
            patient_id=test_patient.id,
            doctor_id=test_user.id,
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=1),
            type=AppointmentType.CONSULTATION,
            status=AppointmentStatus.SCHEDULED,
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)

        update_data = {
            "reason": "Updated reason",
            "notes": "Test notes",
        }

        response = client.put(
            f"/api/v1/appointments/{appointment.id}",
            json=update_data,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["reason"] == "Updated reason"
        assert data["notes"] == "Test notes"

    def test_update_appointment_status(self, client, db, test_patient, test_user, auth_headers):
        """Test updating appointment status"""
        appointment = Appointment(
            patient_id=test_patient.id,
            doctor_id=test_user.id,
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=1),
            type=AppointmentType.CONSULTATION,
            status=AppointmentStatus.SCHEDULED,
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)

        response = client.patch(
            f"/api/v1/appointments/{appointment.id}/status",
            json={"status": AppointmentStatus.CONFIRMED.value},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == AppointmentStatus.CONFIRMED.value


class TestAppointmentDeletion:
    """Test appointment deletion"""

    def test_delete_appointment(self, client, db, test_patient, test_user, auth_headers):
        """Test deleting appointment"""
        appointment = Appointment(
            patient_id=test_patient.id,
            doctor_id=test_user.id,
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=1),
            type=AppointmentType.CONSULTATION,
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)

        appointment_id = appointment.id

        response = client.delete(
            f"/api/v1/appointments/{appointment_id}",
            headers=auth_headers,
        )

        assert response.status_code == 204

        # Verify deletion
        get_response = client.get(
            f"/api/v1/appointments/{appointment_id}",
            headers=auth_headers,
        )
        assert get_response.status_code == 404


class TestAppointmentConflictCheck:
    """Test conflict checking"""

    def test_check_conflicts_no_conflict(self, client, test_user, auth_headers):
        """Test conflict check with no conflicts"""
        start_time = datetime.now() + timedelta(days=1, hours=10)
        end_time = start_time + timedelta(hours=1)

        conflict_data = {
            "doctor_id": test_user.id,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
        }

        response = client.post(
            "/api/v1/appointments/check-conflicts",
            json=conflict_data,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_conflict"] is False
        assert len(data["conflicting_appointments"]) == 0

    def test_check_conflicts_with_conflict(self, client, db, test_patient, test_user, auth_headers):
        """Test conflict check with existing appointment"""
        # Create existing appointment
        start_time = datetime.now() + timedelta(days=1, hours=10)
        end_time = start_time + timedelta(hours=1)

        appointment = Appointment(
            patient_id=test_patient.id,
            doctor_id=test_user.id,
            start_time=start_time,
            end_time=end_time,
            type=AppointmentType.CONSULTATION,
            status=AppointmentStatus.SCHEDULED,
        )
        db.add(appointment)
        db.commit()

        # Check for conflict
        conflict_data = {
            "doctor_id": test_user.id,
            "start_time": (start_time + timedelta(minutes=30)).isoformat(),
            "end_time": (end_time + timedelta(minutes=30)).isoformat(),
        }

        response = client.post(
            "/api/v1/appointments/check-conflicts",
            json=conflict_data,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_conflict"] is True
        assert len(data["conflicting_appointments"]) > 0


class TestAppointmentStats:
    """Test appointment statistics"""

    def test_get_stats(self, client, db, test_patient, test_user, auth_headers):
        """Test getting appointment statistics"""
        # Create various appointments
        now = datetime.now()

        # Scheduled
        appointment1 = Appointment(
            patient_id=test_patient.id,
            doctor_id=test_user.id,
            start_time=now + timedelta(days=1),
            end_time=now + timedelta(days=1, hours=1),
            type=AppointmentType.CONSULTATION,
            status=AppointmentStatus.SCHEDULED,
        )

        # Completed
        appointment2 = Appointment(
            patient_id=test_patient.id,
            doctor_id=test_user.id,
            start_time=now - timedelta(days=1),
            end_time=now - timedelta(days=1, hours=1),
            type=AppointmentType.CONSULTATION,
            status=AppointmentStatus.COMPLETED,
        )

        db.add_all([appointment1, appointment2])
        db.commit()

        response = client.get(
            "/api/v1/appointments/stats/overview",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_appointments"] >= 2
        assert data["scheduled"] >= 1
        assert data["completed"] >= 1
