"""
Pytest Configuration and Fixtures
Global fixtures for testing DermaAI backend
"""

import os
import pytest
from typing import Generator
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from fastapi.testclient import TestClient

# Set test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.core.security import get_password_hash, create_access_token


# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def test_db() -> Generator[Session, None, None]:
    """
    Create a fresh database for each test function
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create session
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db: Session) -> Generator[TestClient, None, None]:
    """
    Create a test client with database session
    """
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(test_db: Session) -> User:
    """
    Create a test user
    """
    user = User(
        email="test@dermai.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        is_active=True,
        is_superuser=False,
        role="doctor"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_superuser(test_db: Session) -> User:
    """
    Create a test superuser
    """
    user = User(
        email="admin@dermai.com",
        hashed_password=get_password_hash("adminpassword123"),
        full_name="Admin User",
        is_active=True,
        is_superuser=True,
        role="admin"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_token(test_user: User) -> str:
    """
    Create authentication token for test user
    """
    return create_access_token(
        data={"sub": test_user.email}
    )


@pytest.fixture(scope="function")
def auth_headers(auth_token: str) -> dict:
    """
    Create authentication headers
    """
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="function")
def superuser_token(test_superuser: User) -> str:
    """
    Create authentication token for superuser
    """
    return create_access_token(
        data={"sub": test_superuser.email}
    )


@pytest.fixture(scope="function")
def superuser_headers(superuser_token: str) -> dict:
    """
    Create authentication headers for superuser
    """
    return {"Authorization": f"Bearer {superuser_token}"}


@pytest.fixture(scope="function")
def test_patient(test_db: Session) -> Patient:
    """
    Create a test patient
    """
    from app.models.patient import IdentificationType, Gender

    patient = Patient(
        identification_type=IdentificationType.CIN,
        identification_number="AB123456",
        first_name="Jean",
        last_name="Dupont",
        email="jean.dupont@example.com",
        phone="0612345678",
        date_of_birth=datetime(1990, 1, 1),
        gender=Gender.MALE,
        address="123 Rue de Test",
        city="Paris",
        postal_code="75001",
        country="France"
    )
    test_db.add(patient)
    test_db.commit()
    test_db.refresh(patient)
    return patient


@pytest.fixture(scope="function")
def test_patient_2(test_db: Session) -> Patient:
    """
    Create a second test patient
    """
    from app.models.patient import IdentificationType, Gender

    patient = Patient(
        identification_type=IdentificationType.CIN,
        identification_number="CD789012",
        first_name="Marie",
        last_name="Martin",
        email="marie.martin@example.com",
        phone="0623456789",
        date_of_birth=datetime(1985, 5, 15),
        gender=Gender.FEMALE,
        address="456 Avenue de Test",
        city="Lyon",
        postal_code="69001",
        country="France"
    )
    test_db.add(patient)
    test_db.commit()
    test_db.refresh(patient)
    return patient


@pytest.fixture(scope="function")
def test_appointment(
    test_db: Session,
    test_patient: Patient,
    test_user: User
) -> Appointment:
    """
    Create a test appointment
    """
    appointment = Appointment(
        patient_id=test_patient.id,
        doctor_id=test_user.id,
        appointment_type="consultation",
        start_time=datetime.now() + timedelta(days=1, hours=10),
        end_time=datetime.now() + timedelta(days=1, hours=11),
        status="scheduled",
        notes="Test appointment"
    )
    test_db.add(appointment)
    test_db.commit()
    test_db.refresh(appointment)
    return appointment


@pytest.fixture(scope="function")
def test_appointment_past(
    test_db: Session,
    test_patient: Patient,
    test_user: User
) -> Appointment:
    """
    Create a past test appointment
    """
    appointment = Appointment(
        patient_id=test_patient.id,
        doctor_id=test_user.id,
        appointment_type="consultation",
        start_time=datetime.now() - timedelta(days=1, hours=10),
        end_time=datetime.now() - timedelta(days=1, hours=9),
        status="completed",
        notes="Past appointment"
    )
    test_db.add(appointment)
    test_db.commit()
    test_db.refresh(appointment)
    return appointment


@pytest.fixture(scope="function")
def multiple_appointments(
    test_db: Session,
    test_patient: Patient,
    test_patient_2: Patient,
    test_user: User
) -> list[Appointment]:
    """
    Create multiple test appointments
    """
    appointments = []

    # Tomorrow morning
    app1 = Appointment(
        patient_id=test_patient.id,
        doctor_id=test_user.id,
        appointment_type="consultation",
        start_time=datetime.now() + timedelta(days=1, hours=9),
        end_time=datetime.now() + timedelta(days=1, hours=10),
        status="scheduled"
    )

    # Tomorrow afternoon
    app2 = Appointment(
        patient_id=test_patient_2.id,
        doctor_id=test_user.id,
        appointment_type="follow_up",
        start_time=datetime.now() + timedelta(days=1, hours=14),
        end_time=datetime.now() + timedelta(days=1, hours=15),
        status="scheduled"
    )

    # Next week
    app3 = Appointment(
        patient_id=test_patient.id,
        doctor_id=test_user.id,
        appointment_type="emergency",
        start_time=datetime.now() + timedelta(days=7, hours=10),
        end_time=datetime.now() + timedelta(days=7, hours=11),
        status="scheduled"
    )

    appointments = [app1, app2, app3]

    for appointment in appointments:
        test_db.add(appointment)

    test_db.commit()

    for appointment in appointments:
        test_db.refresh(appointment)

    return appointments


# Async fixtures for async tests
@pytest.fixture(scope="function")
async def async_client(test_db: Session):
    """
    Create async test client
    """
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    from httpx import AsyncClient
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# Configure pytest-asyncio
@pytest.fixture(scope="session")
def event_loop():
    """
    Create event loop for async tests
    """
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
