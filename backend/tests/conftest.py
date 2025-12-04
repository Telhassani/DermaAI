"""
Shared pytest fixtures and configuration for all tests
"""

import pytest
from datetime import datetime, timedelta, date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.main import app
from app.db.base import Base
from app.models.user import User, UserRole
from app.models.patient import Patient, Gender, IdentificationType
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.core.security import get_password_hash
from app.db.session import get_db

# Test database configuration
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create test database and session"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create test client with overridden database dependency"""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# ============================================================================
# User Fixtures
# ============================================================================


@pytest.fixture(scope="function")
def test_doctor(db):
    """Create test doctor user"""
    user = User(
        email="doctor@test.com",
        full_name="Dr. Test Doctor",
        hashed_password=get_password_hash("DoctorTest123!"),
        role=UserRole.DOCTOR,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_assistant(db):
    """Create test assistant user"""
    user = User(
        email="assistant@test.com",
        full_name="Test Assistant",
        hashed_password=get_password_hash("AssistantTest123!"),
        role=UserRole.ASSISTANT,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_admin(db):
    """Create test admin user"""
    user = User(
        email="admin@test.com",
        full_name="Test Admin",
        hashed_password=get_password_hash("AdminTest123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_inactive_user(db):
    """Create test inactive user"""
    user = User(
        email="inactive@test.com",
        full_name="Inactive User",
        hashed_password=get_password_hash("InactiveTest123!"),
        role=UserRole.DOCTOR,
        is_active=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ============================================================================
# Authentication Fixtures
# ============================================================================


@pytest.fixture(scope="function")
def doctor_auth_headers(client, test_doctor):
    """Get authentication headers for test doctor"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": test_doctor.email, "password": "DoctorTest123!"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def assistant_auth_headers(client, test_assistant):
    """Get authentication headers for test assistant"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": test_assistant.email, "password": "AssistantTest123!"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def admin_auth_headers(client, test_admin):
    """Get authentication headers for test admin"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": test_admin.email, "password": "AdminTest123!"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# Patient Fixtures
# ============================================================================


@pytest.fixture(scope="function")
def test_patient(db, test_doctor):
    """Create test patient"""
    patient = Patient(
        identification_type=IdentificationType.CIN,
        identification_number="AB123456789",
        first_name="Test",
        last_name="Patient",
        date_of_birth=date(1990, 5, 15),
        gender=Gender.MALE,
        phone="0612345678",
        email="patient@test.com",
        doctor_id=test_doctor.id,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@pytest.fixture(scope="function")
def test_patient_female(db, test_doctor):
    """Create test female patient"""
    patient = Patient(
        identification_type=IdentificationType.PASSPORT,
        identification_number="PASSPORT123456",
        first_name="Jane",
        last_name="Doe",
        date_of_birth=date(1985, 3, 20),
        gender=Gender.FEMALE,
        phone="0687654321",
        email="jane@test.com",
        doctor_id=test_doctor.id,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@pytest.fixture(scope="function")
def test_patients_multiple(db, test_doctor):
    """Create multiple test patients"""
    patients = []
    for i in range(5):
        patient = Patient(
            identification_type=IdentificationType.CIN,
            identification_number=f"AB{100000+i:06d}",
            first_name=f"Patient{i}",
            last_name="TestCase",
            date_of_birth=date(1980 + i, (i % 9) + 1, 15),
            gender=Gender.MALE if i % 2 == 0 else Gender.FEMALE,
            phone=f"061234567{i}",
            email=f"patient{i}@test.com",
            doctor_id=test_doctor.id,
        )
        db.add(patient)
        patients.append(patient)
    db.commit()
    for patient in patients:
        db.refresh(patient)
    return patients


# ============================================================================
# Appointment Fixtures
# ============================================================================


@pytest.fixture(scope="function")
def test_appointment(db, test_patient, test_doctor):
    """Create test appointment"""
    start_time = datetime.now() + timedelta(days=1, hours=10)
    end_time = start_time + timedelta(hours=1)

    appointment = Appointment(
        patient_id=test_patient.id,
        doctor_id=test_doctor.id,
        start_time=start_time,
        end_time=end_time,
        type=AppointmentType.CONSULTATION,
        status=AppointmentStatus.SCHEDULED,
        reason="Test consultation",
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@pytest.fixture(scope="function")
def test_appointment_past(db, test_patient, test_doctor):
    """Create test past appointment (completed)"""
    start_time = datetime.now() - timedelta(days=1, hours=10)
    end_time = start_time + timedelta(hours=1)

    appointment = Appointment(
        patient_id=test_patient.id,
        doctor_id=test_doctor.id,
        start_time=start_time,
        end_time=end_time,
        type=AppointmentType.FOLLOW_UP,
        status=AppointmentStatus.COMPLETED,
        reason="Past consultation",
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@pytest.fixture(scope="function")
def test_appointments_multiple(db, test_patient, test_doctor):
    """Create multiple test appointments"""
    appointments = []
    for i in range(5):
        start_time = datetime.now() + timedelta(days=i + 1, hours=10)
        end_time = start_time + timedelta(hours=1)

        appointment = Appointment(
            patient_id=test_patient.id,
            doctor_id=test_doctor.id,
            start_time=start_time,
            end_time=end_time,
            type=AppointmentType.CONSULTATION if i % 2 == 0 else AppointmentType.FOLLOW_UP,
            status=AppointmentStatus.SCHEDULED,
            reason=f"Test appointment {i}",
        )
        db.add(appointment)
        appointments.append(appointment)
    db.commit()
    for appointment in appointments:
        db.refresh(appointment)
    return appointments


@pytest.fixture(scope="function")
def test_appointment_conflicting(db, test_patient, test_doctor):
    """Create appointment that conflicts with test_appointment"""
    # test_appointment is at tomorrow 10:00-11:00
    # This one is at tomorrow 10:30-11:30 (overlaps)
    start_time = datetime.now() + timedelta(days=1, hours=10, minutes=30)
    end_time = start_time + timedelta(hours=1)

    appointment = Appointment(
        patient_id=test_patient.id,
        doctor_id=test_doctor.id,
        start_time=start_time,
        end_time=end_time,
        type=AppointmentType.CONSULTATION,
        status=AppointmentStatus.SCHEDULED,
        reason="Conflicting appointment",
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


# ============================================================================
# Helper Fixtures
# ============================================================================


@pytest.fixture(scope="function")
def tomorrow():
    """Get tomorrow's date"""
    return datetime.now() + timedelta(days=1)


@pytest.fixture(scope="function")
def next_week():
    """Get next week's date"""
    return datetime.now() + timedelta(days=7)


@pytest.fixture(scope="function")
def yesterday():
    """Get yesterday's date"""
    return datetime.now() - timedelta(days=1)
