"""
Tests for patient endpoints - CRUD operations

Test data follows validation rules:
- CIN format: ^[A-Z]{2}\d{6,12}$ (e.g., AB1234567890)
- Passport format: ^[A-Z0-9]{6,15}$ (e.g., ABC123456789)
- Phone: Must have at least 10 digits
"""

import pytest
from datetime import date
from app.models.patient import Gender, IdentificationType


class TestPatientCreate:
    """Test patient creation endpoint"""

    def test_create_patient_success(self, client, doctor_auth_headers):
        """Test successful patient creation"""
        response = client.post(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            json={
                "identification_type": IdentificationType.CIN.value,
                "identification_number": "AB1234567890",
                "first_name": "New",
                "last_name": "Patient",
                "date_of_birth": "1990-05-15",
                "gender": Gender.MALE.value,
                "phone": "06 12345678",  # 10 digits
                "email": "new.patient@test.com",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == "New"
        assert data["last_name"] == "Patient"
        assert data["email"] == "new.patient@test.com"
        assert data["identification_number"] == "AB1234567890"
        assert data["gender"] == Gender.MALE.value

    def test_create_patient_without_auth(self, client):
        """Test patient creation without authentication"""
        response = client.post(
            "/api/v1/patients",
            json={
                "identification_type": IdentificationType.CIN.value,
                "identification_number": "CD1234567890",
                "first_name": "Unauth",
                "last_name": "Patient",
                "date_of_birth": "1990-05-15",
                "gender": Gender.MALE.value,
                "phone": "06 12345678",
            },
        )

        assert response.status_code == 401  # Unauthorized, not 403

    def test_create_patient_duplicate_identification_number(
        self, client, doctor_auth_headers, test_patient
    ):
        """Test creation with duplicate identification number"""
        response = client.post(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            json={
                "identification_type": IdentificationType.CIN.value,
                "identification_number": test_patient.identification_number,
                "first_name": "Duplicate",
                "last_name": "Patient",
                "date_of_birth": "1990-05-15",
                "gender": Gender.FEMALE.value,
                "phone": "06 99999999",
            },
        )

        assert response.status_code == 400
        assert "identification" in response.json()["detail"].lower()

    def test_create_patient_duplicate_email(self, client, doctor_auth_headers, test_patient):
        """Test creation with duplicate email"""
        response = client.post(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            json={
                "identification_type": IdentificationType.PASSPORT.value,
                "identification_number": "EF0987654321",
                "first_name": "Duplicate",
                "last_name": "Email",
                "date_of_birth": "1990-05-15",
                "gender": Gender.FEMALE.value,
                "phone": "06 99999999",
                "email": test_patient.email,
            },
        )

        assert response.status_code == 400
        assert "email" in response.json()["detail"].lower()

    def test_create_patient_missing_required_field(self, client, doctor_auth_headers):
        """Test creation with missing required field"""
        response = client.post(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            json={
                "identification_type": IdentificationType.CIN.value,
                # Missing identification_number
                "first_name": "Missing",
                "last_name": "Field",
                "date_of_birth": "1990-05-15",
                "gender": Gender.MALE.value,
            },
        )

        assert response.status_code == 422

    def test_create_patient_invalid_date_format(self, client, doctor_auth_headers):
        """Test creation with invalid date format"""
        response = client.post(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            json={
                "identification_type": IdentificationType.CIN.value,
                "identification_number": "GH1234567890",
                "first_name": "Invalid",
                "last_name": "Date",
                "date_of_birth": "15/05/1990",  # Wrong format
                "gender": Gender.MALE.value,
                "phone": "06 12345678",
            },
        )

        assert response.status_code == 422

    def test_create_patient_invalid_gender(self, client, doctor_auth_headers):
        """Test creation with invalid gender"""
        response = client.post(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            json={
                "identification_type": IdentificationType.CIN.value,
                "identification_number": "IJ1234567890",
                "first_name": "Invalid",
                "last_name": "Gender",
                "date_of_birth": "1990-05-15",
                "gender": "invalid_gender",
                "phone": "06 12345678",
            },
        )

        assert response.status_code == 422

    def test_create_patient_invalid_cin_format(self, client, doctor_auth_headers):
        """Test creation with invalid CIN format (must be 2 uppercase letters + digits)"""
        response = client.post(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            json={
                "identification_type": IdentificationType.CIN.value,
                "identification_number": "abc1234567",  # lowercase letters - invalid
                "first_name": "Invalid",
                "last_name": "CIN",
                "date_of_birth": "1990-05-15",
                "gender": Gender.MALE.value,
                "phone": "06 12345678",
            },
        )

        assert response.status_code == 422

    def test_create_patient_invalid_phone(self, client, doctor_auth_headers):
        """Test creation with invalid phone format"""
        response = client.post(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            json={
                "identification_type": IdentificationType.CIN.value,
                "identification_number": "KL1234567890",
                "first_name": "Invalid",
                "last_name": "Phone",
                "date_of_birth": "1990-05-15",
                "gender": Gender.MALE.value,
                "phone": "123",  # Too short - needs 10 digits
            },
        )

        assert response.status_code == 422

    def test_create_patient_assistant_cannot_create(self, client, assistant_auth_headers):
        """Test that assistant cannot create patient (doctor only)"""
        response = client.post(
            "/api/v1/patients",
            headers=assistant_auth_headers,
            json={
                "identification_type": IdentificationType.CIN.value,
                "identification_number": "MN1234567890",
                "first_name": "Assistant",
                "last_name": "Try",
                "date_of_birth": "1990-05-15",
                "gender": Gender.MALE.value,
                "phone": "06 12345678",
            },
        )

        assert response.status_code == 403


class TestPatientRead:
    """Test patient retrieval endpoints"""

    def test_list_patients_success(self, client, doctor_auth_headers, test_patient):
        """Test successful patient listing"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "patients" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert isinstance(data["patients"], list)

    def test_list_patients_without_auth(self, client):
        """Test patient listing without authentication"""
        response = client.get("/api/v1/patients")

        assert response.status_code == 401  # Unauthorized

    def test_list_patients_pagination(self, client, doctor_auth_headers, test_patients_multiple):
        """Test patient listing with pagination"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            params={"page": 1, "page_size": 2},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["patients"]) <= 2

    def test_list_patients_search_by_name(self, client, doctor_auth_headers, test_patient):
        """Test patient listing with search filter"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            params={"search": test_patient.first_name},
        )

        assert response.status_code == 200
        data = response.json()
        assert "patients" in data

    def test_list_patients_filter_by_gender(self, client, doctor_auth_headers, test_patient):
        """Test patient listing with gender filter"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            params={"gender": Gender.MALE.value},
        )

        assert response.status_code == 200
        data = response.json()
        assert "patients" in data

    def test_get_patient_by_id_success(self, client, doctor_auth_headers, test_patient):
        """Test successful patient retrieval by ID"""
        response = client.get(
            f"/api/v1/patients/{test_patient.id}",
            headers=doctor_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_patient.id
        assert data["first_name"] == test_patient.first_name
        assert data["email"] == test_patient.email

    def test_get_patient_by_id_not_found(self, client, doctor_auth_headers):
        """Test retrieval of non-existent patient"""
        response = client.get(
            "/api/v1/patients/99999",
            headers=doctor_auth_headers,
        )

        assert response.status_code == 404

    def test_get_patient_without_auth(self, client, test_patient):
        """Test patient retrieval without authentication"""
        response = client.get(f"/api/v1/patients/{test_patient.id}")

        assert response.status_code == 401


class TestPatientUpdate:
    """Test patient update endpoint"""

    def test_update_patient_success(self, client, doctor_auth_headers, test_patient):
        """Test successful patient update"""
        response = client.put(
            f"/api/v1/patients/{test_patient.id}",
            headers=doctor_auth_headers,
            json={
                "first_name": "Updated",
                "last_name": "Name",
                "phone": "06 99999999",
                "email": "updated@test.com",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Updated"
        assert data["last_name"] == "Name"
        assert data["phone"] == "06 99999999"

    def test_update_patient_without_auth(self, client, test_patient):
        """Test patient update without authentication"""
        response = client.put(
            f"/api/v1/patients/{test_patient.id}",
            json={
                "first_name": "Hacker",
            },
        )

        assert response.status_code == 401

    def test_update_patient_not_found(self, client, doctor_auth_headers):
        """Test update of non-existent patient"""
        response = client.put(
            "/api/v1/patients/99999",
            headers=doctor_auth_headers,
            json={"first_name": "NonExistent"},
        )

        assert response.status_code == 404

    def test_update_patient_duplicate_email(
        self, client, doctor_auth_headers, test_patient, test_patient_female
    ):
        """Test update with existing email"""
        response = client.put(
            f"/api/v1/patients/{test_patient.id}",
            headers=doctor_auth_headers,
            json={
                "email": test_patient_female.email,
            },
        )

        assert response.status_code == 400
        assert "email" in response.json()["detail"].lower()

    def test_update_patient_partial_fields(self, client, doctor_auth_headers, test_patient):
        """Test partial patient update (only some fields)"""
        original_first_name = test_patient.first_name
        response = client.put(
            f"/api/v1/patients/{test_patient.id}",
            headers=doctor_auth_headers,
            json={
                "phone": "06 11111111",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["phone"] == "06 11111111"
        # First name should remain unchanged
        assert data["first_name"] == original_first_name

    def test_update_patient_invalid_email(self, client, doctor_auth_headers, test_patient):
        """Test update with invalid email format"""
        response = client.put(
            f"/api/v1/patients/{test_patient.id}",
            headers=doctor_auth_headers,
            json={
                "email": "invalid-email",
            },
        )

        assert response.status_code == 422

    def test_update_patient_assistant_cannot_update(
        self, client, assistant_auth_headers, test_patient
    ):
        """Test that assistant cannot update patient (doctor only)"""
        response = client.put(
            f"/api/v1/patients/{test_patient.id}",
            headers=assistant_auth_headers,
            json={
                "first_name": "Hacker",
            },
        )

        assert response.status_code == 403

    def test_update_patient_date_of_birth(self, client, doctor_auth_headers, test_patient):
        """Test updating patient date of birth"""
        new_dob = "1995-08-20"
        response = client.put(
            f"/api/v1/patients/{test_patient.id}",
            headers=doctor_auth_headers,
            json={
                "date_of_birth": new_dob,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["date_of_birth"] == new_dob


class TestPatientDelete:
    """Test patient deletion endpoint"""

    def test_delete_patient_success(self, client, db, doctor_auth_headers, test_patient):
        """Test successful patient deletion (soft delete)"""
        patient_id = test_patient.id
        response = client.delete(
            f"/api/v1/patients/{patient_id}",
            headers=doctor_auth_headers,
        )

        assert response.status_code == 204

    def test_delete_patient_without_auth(self, client, test_patient):
        """Test patient deletion without authentication"""
        response = client.delete(f"/api/v1/patients/{test_patient.id}")

        assert response.status_code == 401

    def test_delete_patient_not_found(self, client, doctor_auth_headers):
        """Test deletion of non-existent patient"""
        response = client.delete(
            "/api/v1/patients/99999",
            headers=doctor_auth_headers,
        )

        assert response.status_code == 404

    def test_delete_patient_assistant_cannot_delete(
        self, client, assistant_auth_headers, test_patient
    ):
        """Test that assistant cannot delete patient (doctor only)"""
        response = client.delete(
            f"/api/v1/patients/{test_patient.id}",
            headers=assistant_auth_headers,
        )

        assert response.status_code == 403


class TestPatientFiltering:
    """Test patient filtering and search capabilities"""

    def test_filter_by_min_age(self, client, doctor_auth_headers, test_patients_multiple):
        """Test filtering patients by minimum age"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            params={"min_age": 30},
        )

        assert response.status_code == 200
        data = response.json()
        assert "patients" in data

    def test_filter_by_max_age(self, client, doctor_auth_headers, test_patients_multiple):
        """Test filtering patients by maximum age"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            params={"max_age": 40},
        )

        assert response.status_code == 200
        data = response.json()
        assert "patients" in data

    def test_filter_by_age_range(self, client, doctor_auth_headers, test_patients_multiple):
        """Test filtering patients by age range"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            params={"min_age": 25, "max_age": 45},
        )

        assert response.status_code == 200
        data = response.json()
        assert "patients" in data

    def test_search_by_phone(self, client, doctor_auth_headers, test_patient):
        """Test searching patients by phone"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            params={"search": test_patient.phone},
        )

        assert response.status_code == 200
        data = response.json()
        assert "patients" in data

    def test_search_by_email(self, client, doctor_auth_headers, test_patient):
        """Test searching patients by email"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            params={"search": test_patient.email},
        )

        assert response.status_code == 200
        data = response.json()
        assert "patients" in data

    def test_sorting_by_name_asc(self, client, doctor_auth_headers, test_patients_multiple):
        """Test sorting patients by name ascending"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            params={"sort_by": "first_name", "sort_order": "asc"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "patients" in data

    def test_sorting_by_created_date_desc(self, client, doctor_auth_headers, test_patients_multiple):
        """Test sorting patients by creation date descending"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            params={"sort_by": "created_at", "sort_order": "desc"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "patients" in data

    def test_invalid_sort_order(self, client, doctor_auth_headers):
        """Test invalid sort order parameter"""
        response = client.get(
            "/api/v1/patients",
            headers=doctor_auth_headers,
            params={"sort_order": "invalid"},
        )

        assert response.status_code == 422
