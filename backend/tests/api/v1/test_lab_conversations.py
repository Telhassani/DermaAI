"""
Tests for Lab Conversations API endpoints
Tests conversation CRUD, messaging, streaming, and file handling
"""

import pytest
import json
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from datetime import datetime
from fastapi.testclient import TestClient

from app.main import app
from app.models.lab_conversation import (
    LabConversation,
    LabMessage,
    LabMessageAttachment,
    MessageRole,
    MessageType,
    AttachmentType,
)
from app.schemas.lab_conversation import ConversationResponse, MessageResponse


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    """Get authentication headers for a test user"""
    # In a real test, this would authenticate with the app
    return {"Authorization": "Bearer test_token"}


@pytest.fixture
def mock_doctor_user():
    """Mock doctor user"""
    user = Mock()
    user.id = 1
    user.email = "doctor@dermai.com"
    user.role.value = "doctor"
    return user


@pytest.fixture
def mock_conversation():
    """Mock conversation"""
    conv = Mock(spec=LabConversation)
    conv.id = 1
    conv.doctor_id = 1
    conv.title = "Test Conversation"
    conv.description = "Test Description"
    conv.default_model = "claude-3-5-sonnet-20241022"
    conv.system_prompt = "You are a medical AI"
    conv.message_count = 0
    conv.last_message_at = None
    conv.is_pinned = False
    conv.is_archived = False
    conv.created_at = datetime.utcnow()
    conv.updated_at = datetime.utcnow()
    conv.messages = []
    return conv


@pytest.fixture
def mock_user_message(mock_conversation):
    """Mock user message"""
    msg = Mock(spec=LabMessage)
    msg.id = 1
    msg.conversation_id = mock_conversation.id
    msg.role = MessageRole.USER
    msg.message_type = MessageType.TEXT
    msg.content = "What is this condition?"
    msg.model_used = None
    msg.prompt_tokens = None
    msg.completion_tokens = None
    msg.processing_time_ms = None
    msg.has_attachments = False
    msg.attachments = []
    msg.is_edited = False
    msg.created_at = datetime.utcnow()
    msg.updated_at = datetime.utcnow()
    return msg


@pytest.fixture
def mock_ai_message(mock_conversation):
    """Mock AI response message"""
    msg = Mock(spec=LabMessage)
    msg.id = 2
    msg.conversation_id = mock_conversation.id
    msg.role = MessageRole.ASSISTANT
    msg.message_type = MessageType.TEXT
    msg.content = "This appears to be a dermatological condition..."
    msg.model_used = "claude-3-5-sonnet-20241022"
    msg.prompt_tokens = 100
    msg.completion_tokens = 150
    msg.processing_time_ms = 2500
    msg.has_attachments = False
    msg.attachments = []
    msg.is_edited = False
    msg.created_at = datetime.utcnow()
    msg.updated_at = datetime.utcnow()
    return msg


# ============================================================================
# CONVERSATION CRUD TESTS
# ============================================================================


class TestConversationCRUD:
    """Test conversation CRUD operations"""

    @patch("app.api.v1.lab_conversations.LabConversationService.create_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_create_conversation(self, mock_get_user, mock_create, client, auth_headers, mock_doctor_user, mock_conversation):
        """Test creating a new conversation"""
        mock_get_user.return_value = mock_doctor_user
        mock_create.return_value = mock_conversation

        response = client.post(
            "/api/v1/lab-conversations/conversations",
            json={
                "title": "Test Conversation",
                "description": "Test Description",
                "system_prompt": "You are a medical AI",
            },
            headers=auth_headers,
        )

        # Should create successfully
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["title"] == "Test Conversation"
        assert data["description"] == "Test Description"

    @patch("app.api.v1.lab_conversations.LabConversationService.list_conversations")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_list_conversations(self, mock_get_user, mock_list, client, auth_headers, mock_doctor_user, mock_conversation):
        """Test listing conversations with pagination"""
        mock_get_user.return_value = mock_doctor_user
        mock_list.return_value = ([mock_conversation], 1)

        response = client.get(
            "/api/v1/lab-conversations/conversations?skip=0&limit=50",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 1
        assert data["total"] == 1

    @patch("app.api.v1.lab_conversations.LabConversationService.get_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_get_conversation(self, mock_get_user, mock_get, client, auth_headers, mock_doctor_user, mock_conversation, mock_user_message):
        """Test retrieving a single conversation with messages"""
        mock_get_user.return_value = mock_doctor_user
        mock_conversation.messages = [mock_user_message]
        mock_get.return_value = mock_conversation

        response = client.get(
            "/api/v1/lab-conversations/conversations/1",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["title"] == "Test Conversation"
        assert "messages" in data

    @patch("app.api.v1.lab_conversations.LabConversationService.update_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_update_conversation(self, mock_get_user, mock_update, client, auth_headers, mock_doctor_user, mock_conversation):
        """Test updating conversation metadata"""
        mock_get_user.return_value = mock_doctor_user
        updated_conv = mock_conversation
        updated_conv.title = "Updated Title"
        mock_update.return_value = updated_conv

        response = client.put(
            "/api/v1/lab-conversations/conversations/1",
            json={"title": "Updated Title"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    @patch("app.api.v1.lab_conversations.LabConversationService.delete_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_delete_conversation(self, mock_get_user, mock_delete, client, auth_headers, mock_doctor_user):
        """Test deleting a conversation"""
        mock_get_user.return_value = mock_doctor_user
        mock_delete.return_value = True

        response = client.delete(
            "/api/v1/lab-conversations/conversations/1",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["success"] is True


# ============================================================================
# CONVERSATION MANAGEMENT TESTS
# ============================================================================


class TestConversationManagement:
    """Test conversation pin/archive operations"""

    @patch("app.api.v1.lab_conversations.LabConversationService.pin_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_pin_conversation(self, mock_get_user, mock_pin, client, auth_headers, mock_doctor_user, mock_conversation):
        """Test pinning a conversation"""
        mock_get_user.return_value = mock_doctor_user
        mock_conversation.is_pinned = True
        mock_pin.return_value = mock_conversation

        response = client.patch(
            "/api/v1/lab-conversations/conversations/1/pin",
            json={"is_pinned": True},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_pinned"] is True

    @patch("app.api.v1.lab_conversations.LabConversationService.archive_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_archive_conversation(self, mock_get_user, mock_archive, client, auth_headers, mock_doctor_user, mock_conversation):
        """Test archiving a conversation"""
        mock_get_user.return_value = mock_doctor_user
        mock_conversation.is_archived = True
        mock_archive.return_value = mock_conversation

        response = client.patch(
            "/api/v1/lab-conversations/conversations/1/archive",
            json={"is_archived": True},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_archived"] is True


# ============================================================================
# MESSAGING TESTS
# ============================================================================


class TestMessaging:
    """Test message creation and retrieval"""

    @patch("app.api.v1.lab_conversations.LabConversationService.get_conversation")
    @patch("app.api.v1.lab_conversations.LabMessageService.create_message")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_send_text_message(self, mock_get_user, mock_create_msg, mock_get_conv, client, auth_headers, mock_doctor_user, mock_conversation, mock_user_message):
        """Test sending a text message"""
        mock_get_user.return_value = mock_doctor_user
        mock_get_conv.return_value = mock_conversation
        mock_create_msg.return_value = mock_user_message

        response = client.post(
            "/api/v1/lab-conversations/conversations/1/messages",
            data={
                "content": "What is this condition?",
                "message_type": "TEXT",
            },
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["role"] == "USER"
        assert data["content"] == "What is this condition?"

    @patch("app.api.v1.lab_conversations.get_file_service")
    @patch("app.api.v1.lab_conversations.LabConversationService.get_conversation")
    @patch("app.api.v1.lab_conversations.LabMessageService.create_message")
    @patch("app.api.v1.lab_conversations.LabMessageAttachmentService.create_attachment")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_send_message_with_file(self, mock_get_user, mock_create_attachment, mock_create_msg, mock_get_conv, mock_get_file_service, client, auth_headers, mock_doctor_user, mock_conversation, mock_user_message):
        """Test sending a message with file attachment"""
        mock_get_user.return_value = mock_doctor_user
        mock_get_conv.return_value = mock_conversation
        mock_create_msg.return_value = mock_user_message

        # Mock file service
        mock_file_service = MagicMock()
        mock_file_service.validate_file.return_value = (True, None)
        mock_file_service.generate_file_hash.return_value = "abc123"
        mock_file_service.generate_safe_filename.return_value = "abc123_20240101_120000.pdf"
        mock_file_service.save_file.return_value = "lab-conversations/1/abc123_20240101_120000.pdf"
        mock_get_file_service.return_value = mock_file_service

        # Mock attachment
        attachment = Mock(spec=LabMessageAttachment)
        attachment.id = 1
        attachment.file_name = "test.pdf"
        attachment.file_path = "lab-conversations/1/abc123_20240101_120000.pdf"
        mock_create_attachment.return_value = attachment

        response = client.post(
            "/api/v1/lab-conversations/conversations/1/messages",
            data={
                "content": "Lab result attached",
                "message_type": "TEXT",
            },
            files={"file": ("test.pdf", b"PDF content", "application/pdf")},
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["role"] == "USER"

    @patch("app.api.v1.lab_conversations.LabMessageService.list_messages")
    @patch("app.api.v1.lab_conversations.LabConversationService.get_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_list_messages(self, mock_get_user, mock_get_conv, mock_list_msgs, client, auth_headers, mock_doctor_user, mock_conversation, mock_user_message, mock_ai_message):
        """Test listing messages with pagination"""
        mock_get_user.return_value = mock_doctor_user
        mock_get_conv.return_value = mock_conversation
        mock_list_msgs.return_value = ([mock_user_message, mock_ai_message], 2)

        response = client.get(
            "/api/v1/lab-conversations/conversations/1/messages?skip=0&limit=50",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 2

    @patch("app.api.v1.lab_conversations.LabMessageService.delete_message")
    @patch("app.api.v1.lab_conversations.LabConversationService.get_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_delete_message(self, mock_get_user, mock_get_conv, mock_delete_msg, client, auth_headers, mock_doctor_user, mock_conversation):
        """Test deleting a message"""
        mock_get_user.return_value = mock_doctor_user
        mock_get_conv.return_value = mock_conversation
        mock_delete_msg.return_value = True

        response = client.delete(
            "/api/v1/lab-conversations/conversations/1/messages/1",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["success"] is True


# ============================================================================
# ANALYTICS TESTS
# ============================================================================


class TestAnalytics:
    """Test conversation analytics"""

    @patch("app.api.v1.lab_conversations.ConversationAnalyticsService.get_analytics")
    @patch("app.api.v1.lab_conversations.LabConversationService.get_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_get_analytics(self, mock_get_user, mock_get_conv, mock_get_analytics, client, auth_headers, mock_doctor_user, mock_conversation):
        """Test retrieving conversation analytics"""
        mock_get_user.return_value = mock_doctor_user
        mock_get_conv.return_value = mock_conversation
        mock_get_analytics.return_value = {
            "total_messages": 2,
            "user_messages": 1,
            "assistant_messages": 1,
            "total_tokens_used": 250,
            "total_processing_time_ms": 2500,
            "files_uploaded": 0,
            "models_used": ["claude-3-5-sonnet-20241022"],
        }

        response = client.get(
            "/api/v1/lab-conversations/conversations/1/analytics",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_messages"] == 2
        assert data["user_messages"] == 1
        assert data["assistant_messages"] == 1
        assert data["total_tokens_used"] == 250


# ============================================================================
# STREAMING TESTS
# ============================================================================


class TestStreaming:
    """Test AI response streaming"""

    @patch("app.api.v1.lab_conversations.get_ai_service")
    @patch("app.api.v1.lab_conversations.LabMessageService.get_message")
    @patch("app.api.v1.lab_conversations.LabMessageService.list_messages")
    @patch("app.api.v1.lab_conversations.LabConversationService.get_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_stream_ai_response_starts(self, mock_get_user, mock_get_conv, mock_list_msgs, mock_get_msg, mock_get_ai_service, client, auth_headers, mock_doctor_user, mock_conversation, mock_user_message):
        """Test that streaming endpoint initiates correctly"""
        mock_get_user.return_value = mock_doctor_user
        mock_get_conv.return_value = mock_conversation
        mock_get_msg.return_value = mock_user_message
        mock_list_msgs.return_value = ([mock_user_message], 1)

        # Mock AI service
        mock_ai_service = AsyncMock()
        mock_ai_service.validate_model.return_value = True
        mock_ai_service.stream_message = AsyncMock()
        mock_ai_service.stream_message.return_value = None  # Mock async generator
        mock_get_ai_service.return_value = mock_ai_service

        response = client.post(
            "/api/v1/lab-conversations/conversations/1/stream-response",
            json={
                "model": "claude-3-5-sonnet-20241022",
                "user_message_id": 1,
            },
            headers=auth_headers,
        )

        # Should return streaming response
        assert response.status_code == 200

    @patch("app.api.v1.lab_conversations.get_ai_service")
    @patch("app.api.v1.lab_conversations.LabMessageService.get_message")
    @patch("app.api.v1.lab_conversations.LabConversationService.get_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_stream_ai_response_invalid_model(self, mock_get_user, mock_get_conv, mock_get_msg, mock_get_ai_service, client, auth_headers, mock_doctor_user, mock_conversation, mock_user_message):
        """Test streaming with invalid model"""
        mock_get_user.return_value = mock_doctor_user
        mock_get_conv.return_value = mock_conversation
        mock_get_msg.return_value = mock_user_message

        # Mock AI service with invalid model
        mock_ai_service = AsyncMock()
        mock_ai_service.validate_model.return_value = False
        mock_ai_service.get_available_models.return_value = ["claude-3-5-sonnet-20241022"]
        mock_get_ai_service.return_value = mock_ai_service

        response = client.post(
            "/api/v1/lab-conversations/conversations/1/stream-response",
            json={
                "model": "invalid-model-123",
                "user_message_id": 1,
            },
            headers=auth_headers,
        )

        # Should fail with validation error
        assert response.status_code == 400


# ============================================================================
# ERROR HANDLING TESTS
# ============================================================================


class TestErrorHandling:
    """Test error handling and edge cases"""

    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_unauthorized_access(self, mock_get_user, client):
        """Test that unauthorized users cannot access conversations"""
        mock_get_user.side_effect = Exception("Unauthorized")

        response = client.get(
            "/api/v1/lab-conversations/conversations",
            headers={},
        )

        assert response.status_code in [401, 403, 500]

    @patch("app.api.v1.lab_conversations.LabConversationService.get_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_conversation_not_found(self, mock_get_user, mock_get_conv, client, auth_headers, mock_doctor_user):
        """Test accessing non-existent conversation"""
        mock_get_user.return_value = mock_doctor_user
        mock_get_conv.return_value = None

        response = client.get(
            "/api/v1/lab-conversations/conversations/999",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @patch("app.api.v1.lab_conversations.get_file_service")
    @patch("app.api.v1.lab_conversations.LabConversationService.get_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_invalid_file_upload(self, mock_get_user, mock_get_conv, mock_get_file_service, client, auth_headers, mock_doctor_user, mock_conversation):
        """Test uploading invalid file"""
        mock_get_user.return_value = mock_doctor_user
        mock_get_conv.return_value = mock_conversation

        # Mock file service that rejects the file
        mock_file_service = MagicMock()
        mock_file_service.validate_file.return_value = (False, "Unsupported file type")
        mock_get_file_service.return_value = mock_file_service

        response = client.post(
            "/api/v1/lab-conversations/conversations/1/messages",
            data={
                "content": "Message with bad file",
                "message_type": "TEXT",
            },
            files={"file": ("test.exe", b"executable", "application/x-msdownload")},
            headers=auth_headers,
        )

        assert response.status_code == 400

    @patch("app.api.v1.lab_conversations.LabConversationService.get_conversation")
    @patch("app.api.v1.lab_conversations.get_current_active_user")
    def test_role_based_access_control(self, mock_get_user, mock_get_conv, client, auth_headers):
        """Test that non-doctors cannot access lab conversations"""
        # Create non-doctor user
        non_doctor = Mock()
        non_doctor.id = 2
        non_doctor.role.value = "patient"

        mock_get_user.return_value = non_doctor
        mock_get_conv.return_value = None

        response = client.post(
            "/api/v1/lab-conversations/conversations",
            json={"title": "Test"},
            headers=auth_headers,
        )

        assert response.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
