"""
Lab Result Analysis API endpoint tests
Tests for POST /api/v1/ai-analysis/lab-result/analyze endpoint
"""

import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.models.ai_analysis import AnalysisType, AnalysisStatus


class TestLabResultAnalysis:
    """Test suite for lab result analysis endpoint"""

    def test_analyze_lab_results_success(self, client, test_doctor, test_patient, doctor_auth_headers):
        """Test successful lab result analysis"""
        with patch("app.services.ai_analysis.ai_service.analyze_lab_results", new_callable=AsyncMock) as mock_analyze:
            # Mock AI service response
            mock_analyze.return_value = {
                "interpretation": "Lab results indicate normal metabolic function with slightly elevated glucose suggesting prediabetic state",
                "abnormalities": [
                    {"test": "Glucose", "value": 115, "status": "abnormal", "reason": "slightly elevated"},
                    {"test": "Triglycerides", "value": 180, "status": "borderline", "reason": "upper limit of normal"}
                ],
                "recommendations": [
                    "Monitor glucose levels regularly",
                    "Consider dietary adjustments",
                    "Retest in 3 months"
                ],
                "reasoning": "Patient shows early signs of insulin resistance",
                "reference_ranges": [
                    {"test": "Glucose", "normal_range": "70-100 mg/dL"},
                    {"test": "Triglycerides", "normal_range": "<150 mg/dL"}
                ],
                "tokens_used": {"input": 450, "output": 280, "total_tokens": 730},
                "status": "success"
            }

            payload = {
                "patient_id": test_patient.id,
                "consultation_id": None,
                "test_date": "2024-11-23",
                "lab_values": [
                    {
                        "test_name": "Glucose",
                        "value": 115.0,
                        "unit": "mg/dL",
                        "reference_min": 70.0,
                        "reference_max": 100.0,
                        "is_abnormal": True
                    },
                    {
                        "test_name": "Triglycerides",
                        "value": 180.0,
                        "unit": "mg/dL",
                        "reference_min": 0.0,
                        "reference_max": 150.0,
                        "is_abnormal": True
                    },
                    {
                        "test_name": "HDL Cholesterol",
                        "value": 55.0,
                        "unit": "mg/dL",
                        "reference_min": 40.0,
                        "reference_max": 200.0,
                        "is_abnormal": False
                    }
                ],
                "additional_notes": "Patient reports fatigue"
            }

            response = client.post(
                "/api/v1/ai-analysis/lab-result/analyze",
                json=payload,
                headers=doctor_auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["analysis_type"] == AnalysisType.LAB_RESULT.value
            assert data["patient_id"] == test_patient.id
            assert data["doctor_id"] == test_doctor.id
            assert data["status"] == AnalysisStatus.PENDING.value
            assert len(data["clinical_findings"]) > 0
            assert len(data["recommendations"]) > 0

    def test_analyze_lab_results_patient_not_found(self, client, doctor_auth_headers):
        """Test lab analysis with non-existent patient"""
        payload = {
            "patient_id": 99999,
            "lab_values": [
                {
                    "test_name": "Glucose",
                    "value": 115.0,
                    "unit": "mg/dL",
                    "reference_min": 70.0,
                    "reference_max": 100.0,
                    "is_abnormal": True
                }
            ]
        }

        response = client.post(
            "/api/v1/ai-analysis/lab-result/analyze",
            json=payload,
            headers=doctor_auth_headers
        )

        assert response.status_code == 404
        assert "Patient not found" in response.json()["detail"]

    def test_analyze_lab_results_unauthorized(self, client, test_patient):
        """Test lab analysis without authentication"""
        payload = {
            "patient_id": test_patient.id,
            "lab_values": [
                {
                    "test_name": "Glucose",
                    "value": 115.0,
                    "unit": "mg/dL",
                    "reference_min": 70.0,
                    "reference_max": 100.0,
                    "is_abnormal": True
                }
            ]
        }

        response = client.post(
            "/api/v1/ai-analysis/lab-result/analyze",
            json=payload
        )

        assert response.status_code == 401

    def test_analyze_lab_results_non_doctor_forbidden(self, client, test_patient, assistant_auth_headers):
        """Test lab analysis with non-doctor user"""
        payload = {
            "patient_id": test_patient.id,
            "lab_values": [
                {
                    "test_name": "Glucose",
                    "value": 115.0,
                    "unit": "mg/dL",
                    "reference_min": 70.0,
                    "reference_max": 100.0,
                    "is_abnormal": True
                }
            ]
        }

        response = client.post(
            "/api/v1/ai-analysis/lab-result/analyze",
            json=payload,
            headers=assistant_auth_headers
        )

        assert response.status_code == 403

    def test_analyze_lab_results_ai_error(self, client, test_doctor, test_patient, doctor_auth_headers):
        """Test lab analysis when AI service returns error"""
        with patch("app.services.ai_analysis.ai_service.analyze_lab_results", new_callable=AsyncMock) as mock_analyze:
            # Mock AI service error
            mock_analyze.return_value = {
                "error": "Failed to process lab results",
                "status": "error"
            }

            payload = {
                "patient_id": test_patient.id,
                "lab_values": [
                    {
                        "test_name": "Glucose",
                        "value": 115.0,
                        "unit": "mg/dL",
                        "reference_min": 70.0,
                        "reference_max": 100.0,
                        "is_abnormal": True
                    }
                ]
            }

            response = client.post(
                "/api/v1/ai-analysis/lab-result/analyze",
                json=payload,
                headers=doctor_auth_headers
            )

            assert response.status_code == 500
            assert "Failed to process lab results" in response.json()["detail"]

    def test_analyze_lab_results_minimal_payload(self, client, test_doctor, test_patient, doctor_auth_headers):
        """Test lab analysis with minimal required fields"""
        with patch("app.services.ai_analysis.ai_service.analyze_lab_results", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = {
                "interpretation": "Lab results show normal values",
                "abnormalities": [],
                "recommendations": ["Continue current medication"],
                "reasoning": "All values within normal range",
                "status": "success"
            }

            payload = {
                "patient_id": test_patient.id,
                "lab_values": [
                    {
                        "test_name": "TSH",
                        "value": 2.5,
                        "unit": "mIU/L"
                    }
                ]
            }

            response = client.post(
                "/api/v1/ai-analysis/lab-result/analyze",
                json=payload,
                headers=doctor_auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["analysis_type"] == AnalysisType.LAB_RESULT.value
            assert len(data["lab_values_extracted"]) == 1

    def test_analyze_lab_results_multiple_abnormalities(self, client, test_doctor, test_patient, doctor_auth_headers):
        """Test lab analysis with multiple abnormal values"""
        with patch("app.services.ai_analysis.ai_service.analyze_lab_results", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = {
                "interpretation": "Multiple metabolic abnormalities detected requiring intervention",
                "abnormalities": [
                    {"test": "Glucose", "status": "abnormal"},
                    {"test": "Triglycerides", "status": "abnormal"},
                    {"test": "LDL", "status": "abnormal"}
                ],
                "recommendations": [
                    "Urgent metabolic panel review",
                    "Endocrinology consultation",
                    "Dietary and exercise intervention"
                ],
                "status": "success"
            }

            payload = {
                "patient_id": test_patient.id,
                "lab_values": [
                    {
                        "test_name": "Glucose",
                        "value": 250.0,
                        "unit": "mg/dL",
                        "reference_min": 70.0,
                        "reference_max": 100.0,
                        "is_abnormal": True
                    },
                    {
                        "test_name": "Triglycerides",
                        "value": 400.0,
                        "unit": "mg/dL",
                        "reference_min": 0.0,
                        "reference_max": 150.0,
                        "is_abnormal": True
                    },
                    {
                        "test_name": "LDL",
                        "value": 200.0,
                        "unit": "mg/dL",
                        "reference_min": 0.0,
                        "reference_max": 100.0,
                        "is_abnormal": True
                    }
                ],
                "additional_notes": "Patient diabetic, poor compliance with medication"
            }

            response = client.post(
                "/api/v1/ai-analysis/lab-result/analyze",
                json=payload,
                headers=doctor_auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data["lab_values_extracted"]) == 3
            abnormal_count = sum(1 for v in data["lab_values_extracted"] if v.get("is_abnormal"))
            assert abnormal_count == 3

    def test_analyze_lab_results_with_reference_ranges(self, client, test_doctor, test_patient, doctor_auth_headers):
        """Test lab analysis with complete reference range information"""
        with patch("app.services.ai_analysis.ai_service.analyze_lab_results", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = {
                "interpretation": "Lab values analyzed against standard reference ranges",
                "abnormalities": [],
                "recommendations": ["Continue current monitoring"],
                "reference_ranges": [
                    {"test": "Hemoglobin", "min": 13.5, "max": 17.5, "unit": "g/dL"},
                    {"test": "Hematocrit", "min": 41.0, "max": 53.0, "unit": "%"}
                ],
                "status": "success"
            }

            payload = {
                "patient_id": test_patient.id,
                "lab_values": [
                    {
                        "test_name": "Hemoglobin",
                        "value": 15.2,
                        "unit": "g/dL",
                        "reference_min": 13.5,
                        "reference_max": 17.5,
                        "is_abnormal": False
                    },
                    {
                        "test_name": "Hematocrit",
                        "value": 45.0,
                        "unit": "%",
                        "reference_min": 41.0,
                        "reference_max": 53.0,
                        "is_abnormal": False
                    }
                ]
            }

            response = client.post(
                "/api/v1/ai-analysis/lab-result/analyze",
                json=payload,
                headers=doctor_auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["reference_ranges"] is not None

    def test_analyze_lab_results_audit_logging(self, client, test_doctor, test_patient, doctor_auth_headers, db):
        """Test that lab analysis creates audit log entries"""
        from app.models.audit_log import AuditLog

        with patch("app.services.ai_analysis.ai_service.analyze_lab_results", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = {
                "interpretation": "Normal lab results",
                "abnormalities": [],
                "recommendations": [],
                "status": "success"
            }

            payload = {
                "patient_id": test_patient.id,
                "lab_values": [
                    {
                        "test_name": "TSH",
                        "value": 2.0,
                        "unit": "mIU/L",
                        "reference_min": 0.4,
                        "reference_max": 4.0,
                        "is_abnormal": False
                    }
                ]
            }

            # Get initial audit log count
            initial_count = db.query(AuditLog).filter(
                AuditLog.action == "ANALYZE_LAB"
            ).count()

            response = client.post(
                "/api/v1/ai-analysis/lab-result/analyze",
                json=payload,
                headers=doctor_auth_headers
            )

            assert response.status_code == 200

            # Verify audit log was created
            new_count = db.query(AuditLog).filter(
                AuditLog.action == "ANALYZE_LAB"
            ).count()
            assert new_count == initial_count + 1

            # Verify audit log details
            audit_log = db.query(AuditLog).filter(
                AuditLog.action == "ANALYZE_LAB"
            ).order_by(AuditLog.created_at.desc()).first()

            assert audit_log.user_id == str(test_doctor.id)
            assert audit_log.resource == "ai_analysis"
            assert audit_log.success is True

    def test_analyze_lab_results_data_persistence(self, client, test_doctor, test_patient, doctor_auth_headers, db):
        """Test that lab analysis data is properly saved to database"""
        from app.models.ai_analysis import AIAnalysis

        with patch("app.services.ai_analysis.ai_service.analyze_lab_results", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = {
                "interpretation": "Lab interpretation",
                "abnormalities": [{"test": "Potassium", "value": 5.8}],
                "recommendations": ["Monitor electrolytes"],
                "status": "success"
            }

            payload = {
                "patient_id": test_patient.id,
                "test_date": "2024-11-23",
                "lab_values": [
                    {
                        "test_name": "Potassium",
                        "value": 5.8,
                        "unit": "mEq/L",
                        "reference_min": 3.5,
                        "reference_max": 5.0,
                        "is_abnormal": True
                    }
                ],
                "additional_notes": "Patient on ACE inhibitor"
            }

            response = client.post(
                "/api/v1/ai-analysis/lab-result/analyze",
                json=payload,
                headers=doctor_auth_headers
            )

            assert response.status_code == 200
            analysis_id = response.json()["id"]

            # Verify data in database
            db_analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()
            assert db_analysis is not None
            assert db_analysis.analysis_type == AnalysisType.LAB_RESULT
            assert db_analysis.patient_id == test_patient.id
            assert db_analysis.doctor_id == test_doctor.id
            assert db_analysis.status == AnalysisStatus.PENDING
            assert db_analysis.lab_values_extracted is not None
            assert len(db_analysis.lab_values_extracted) == 1

    def test_analyze_lab_results_invalid_lab_values(self, client, test_patient, doctor_auth_headers):
        """Test lab analysis with invalid lab value format"""
        payload = {
            "patient_id": test_patient.id,
            "lab_values": [
                {
                    "test_name": "Glucose",
                    # Missing required 'value' and 'unit' fields
                    "reference_min": 70.0
                }
            ]
        }

        response = client.post(
            "/api/v1/ai-analysis/lab-result/analyze",
            json=payload,
            headers=doctor_auth_headers
        )

        assert response.status_code == 422  # Unprocessable Entity

    def test_analyze_lab_results_empty_lab_values(self, client, test_patient, doctor_auth_headers):
        """Test lab analysis with empty lab values list"""
        payload = {
            "patient_id": test_patient.id,
            "lab_values": []
        }

        response = client.post(
            "/api/v1/ai-analysis/lab-result/analyze",
            json=payload,
            headers=doctor_auth_headers
        )

        # Should fail validation
        assert response.status_code == 422
