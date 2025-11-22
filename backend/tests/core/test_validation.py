"""
Tests for Input Validation and Sanitization Module

Validates file uploads, HTML sanitization, text input validation,
XSS prevention, and SQL injection detection.
"""

import pytest
from app.core.validation import (
    validate_file_upload,
    validate_filename,
    sanitize_html,
    sanitize_text,
    validate_email,
    validate_phone,
    validate_identification,
    validate_text_length,
    detect_sql_injection_attempt,
    escape_html,
    is_safe_string,
    MAX_FILE_SIZE_BYTES,
)


# ============================================================================
# File Upload Validation Tests
# ============================================================================

class TestFileUploadValidation:
    """Test file upload validation"""

    def test_valid_jpeg_upload(self):
        """Test valid JPEG file upload"""
        valid, error = validate_file_upload(
            "patient_scan.jpg",
            "image/jpeg",
            1024 * 100,  # 100 KB
        )
        assert valid is True
        assert error is None

    def test_valid_png_upload(self):
        """Test valid PNG file upload"""
        valid, error = validate_file_upload(
            "xray.png",
            "image/png",
            1024 * 500,  # 500 KB
        )
        assert valid is True
        assert error is None

    def test_valid_webp_upload(self):
        """Test valid WebP file upload"""
        valid, error = validate_file_upload(
            "scan.webp",
            "image/webp",
            1024 * 200,
        )
        assert valid is True
        assert error is None

    def test_file_size_exceeds_limit(self):
        """Test file size exceeding maximum"""
        valid, error = validate_file_upload(
            "huge_file.jpg",
            "image/jpeg",
            MAX_FILE_SIZE_BYTES + 1,
        )
        assert valid is False
        assert "exceeds maximum" in error

    def test_empty_file(self):
        """Test empty file rejection"""
        valid, error = validate_file_upload(
            "empty.jpg",
            "image/jpeg",
            0,
        )
        assert valid is False
        assert "empty" in error.lower()

    def test_executable_file_rejection(self):
        """Test executable file rejection"""
        valid, error = validate_file_upload(
            "malware.exe",
            "application/x-msdownload",
            1024,
        )
        assert valid is False
        assert ".exe" in error or "not allowed" in error

    def test_script_file_rejection(self):
        """Test script file rejection"""
        valid, error = validate_file_upload(
            "malicious.js",
            "text/javascript",
            500,
        )
        assert valid is False
        assert ".js" in error or "not allowed" in error

    def test_bat_file_rejection(self):
        """Test batch file rejection"""
        valid, error = validate_file_upload(
            "script.bat",
            "text/plain",
            200,
        )
        assert valid is False
        assert ".bat" in error or "not allowed" in error

    def test_wrong_mime_type_warning(self):
        """Test wrong MIME type (file allowed but logged)"""
        # File has correct extension but wrong MIME type
        valid, error = validate_file_upload(
            "image.jpg",
            "text/plain",  # Wrong MIME type
            1024,
        )
        # Still valid because we can't trust MIME type anyway
        assert valid is True
        assert error is None

    def test_directory_traversal_rejection(self):
        """Test directory traversal attempt rejection"""
        valid, error = validate_file_upload(
            "../../../etc/passwd",
            "image/jpeg",
            1024,
        )
        assert valid is False
        assert "path" in error.lower() or "suspicious" in error.lower()

    def test_null_byte_rejection(self):
        """Test null byte in filename rejection"""
        valid, error = validate_file_upload(
            "file.jpg\x00.txt",
            "image/jpeg",
            1024,
        )
        assert valid is False
        assert "suspicious" in error.lower()

    def test_invalid_characters_in_filename(self):
        """Test invalid characters rejection"""
        valid, error = validate_file_upload(
            "file<script>.jpg",
            "image/jpeg",
            1024,
        )
        assert valid is False
        assert "suspicious" in error.lower()


class TestFilenameValidation:
    """Test filename validation"""

    def test_valid_filename(self):
        """Test valid filename"""
        valid, error = validate_filename("patient_scan_001.jpg")
        assert valid is True
        assert error is None

    def test_filename_with_path(self):
        """Test filename containing path"""
        valid, error = validate_filename("../uploads/file.jpg")
        assert valid is False
        assert "path" in error.lower()

    def test_filename_too_long(self):
        """Test filename exceeding 255 characters"""
        long_name = "a" * 300 + ".jpg"
        valid, error = validate_filename(long_name)
        assert valid is False
        assert "too long" in error.lower()

    def test_empty_filename(self):
        """Test empty filename"""
        valid, error = validate_filename("")
        assert valid is False
        assert "empty" in error.lower()

    def test_filename_with_spaces(self):
        """Test filename with spaces (should be valid)"""
        valid, error = validate_filename("patient scan 001.jpg")
        assert valid is True
        assert error is None


# ============================================================================
# HTML Sanitization Tests
# ============================================================================

class TestHTMLSanitization:
    """Test HTML sanitization"""

    def test_sanitize_plain_text(self):
        """Test plain text remains unchanged"""
        text = "This is a diagnosis note"
        sanitized = sanitize_html(text)
        assert sanitized == text

    def test_remove_script_tags(self):
        """Test script tags are removed"""
        html = "Normal text <script>alert('XSS')</script> more text"
        sanitized = sanitize_html(html)
        assert "<script>" not in sanitized
        assert "alert" not in sanitized

    def test_remove_event_handlers(self):
        """Test event handlers are removed"""
        html = '<div onclick="alert(\'xss\')">Click me</div>'
        sanitized = sanitize_html(html)
        assert "onclick" not in sanitized

    def test_remove_onerror_handler(self):
        """Test onerror handler removal"""
        html = '<img src="x" onerror="alert(\'xss\')">'
        sanitized = sanitize_html(html)
        assert "onerror" not in sanitized

    def test_strip_all_html_by_default(self):
        """Test all HTML stripped by default"""
        html = "<p>Patient is <strong>stable</strong></p>"
        sanitized = sanitize_html(html, allow_html=False)
        assert "<p>" not in sanitized
        assert "<strong>" not in sanitized
        assert "Patient is stable" in sanitized

    def test_allow_safe_html_tags(self):
        """Test safe HTML tags allowed when flag set"""
        html = "<p>Patient <strong>stable</strong></p>"
        sanitized = sanitize_html(html, allow_html=True)
        # With bleach installed, safe tags should be preserved
        # Without bleach, all HTML is stripped
        assert "Patient" in sanitized
        assert "stable" in sanitized

    def test_data_url_removal(self):
        """Test data URLs are removed"""
        html = '<img src="data:text/html,<script>alert(\'xss\')</script>">'
        sanitized = sanitize_html(html)
        assert "<script>" not in sanitized

    def test_javascript_protocol_removal(self):
        """Test javascript: protocol is removed"""
        html = '<a href="javascript:alert(\'xss\')">Click</a>'
        sanitized = sanitize_html(html)
        assert "javascript:" not in sanitized

    def test_empty_html(self):
        """Test empty HTML"""
        sanitized = sanitize_html("")
        assert sanitized == ""

    def test_multiple_script_tags(self):
        """Test multiple script tags removal"""
        html = "<script>bad1</script>text<script>bad2</script>"
        sanitized = sanitize_html(html)
        assert "<script>" not in sanitized
        assert "bad1" not in sanitized
        assert "bad2" not in sanitized
        assert "text" in sanitized


# ============================================================================
# Text Sanitization Tests
# ============================================================================

class TestTextSanitization:
    """Test text sanitization"""

    def test_sanitize_normal_text(self):
        """Test normal text remains unchanged"""
        text = "This is normal medical text"
        sanitized = sanitize_text(text)
        assert sanitized == text

    def test_remove_null_bytes(self):
        """Test null byte removal"""
        text = "Normal\x00text"
        sanitized = sanitize_text(text)
        assert "\x00" not in sanitized
        assert "Normal" in sanitized
        assert "text" in sanitized

    def test_strip_whitespace(self):
        """Test whitespace stripping"""
        text = "  \t  Some text  \n  "
        sanitized = sanitize_text(text)
        assert sanitized == "Some text"

    def test_limit_length(self):
        """Test text length limiting"""
        text = "a" * 10000
        sanitized = sanitize_text(text, max_length=1000)
        assert len(sanitized) == 1000

    def test_preserve_newlines(self):
        """Test newlines are preserved"""
        text = "Line 1\nLine 2\nLine 3"
        sanitized = sanitize_text(text)
        assert "\n" in sanitized
        assert "Line 1" in sanitized
        assert "Line 3" in sanitized

    def test_preserve_tabs(self):
        """Test tabs are preserved"""
        text = "Col1\tCol2\tCol3"
        sanitized = sanitize_text(text)
        assert "\t" in sanitized

    def test_remove_control_characters(self):
        """Test control character removal"""
        text = "Normal\x01Control\x1fChars"
        sanitized = sanitize_text(text)
        assert "\x01" not in sanitized
        assert "\x1f" not in sanitized
        assert "Normal" in sanitized
        assert "Control" in sanitized
        assert "Chars" in sanitized


# ============================================================================
# Email Validation Tests
# ============================================================================

class TestEmailValidation:
    """Test email validation"""

    def test_valid_email(self):
        """Test valid email"""
        assert validate_email("user@example.com") is True

    def test_valid_email_with_plus(self):
        """Test email with plus sign"""
        assert validate_email("user+tag@example.co.uk") is True

    def test_invalid_email_no_at(self):
        """Test email without @ sign"""
        assert validate_email("userexample.com") is False

    def test_invalid_email_no_domain(self):
        """Test email without domain"""
        assert validate_email("user@") is False

    def test_invalid_email_no_tld(self):
        """Test email without TLD"""
        assert validate_email("user@example") is False

    def test_empty_email(self):
        """Test empty email"""
        assert validate_email("") is False

    def test_email_too_long(self):
        """Test email exceeding max length"""
        long_email = "a" * 250 + "@example.com"
        assert validate_email(long_email) is False


# ============================================================================
# Phone Validation Tests
# ============================================================================

class TestPhoneValidation:
    """Test phone validation"""

    def test_valid_phone_10_digits(self):
        """Test valid phone with 10 digits"""
        assert validate_phone("555-123-4567") is True

    def test_valid_phone_with_spaces(self):
        """Test valid phone with spaces"""
        assert validate_phone("555 123 4567") is True

    def test_valid_phone_with_parentheses(self):
        """Test valid phone with parentheses"""
        assert validate_phone("(555) 123-4567") is True

    def test_valid_phone_with_plus(self):
        """Test valid phone with plus"""
        assert validate_phone("+1 555 123 4567") is True

    def test_invalid_phone_too_short(self):
        """Test phone with too few digits"""
        assert validate_phone("123-456") is False

    def test_invalid_phone_no_digits(self):
        """Test phone with no digits"""
        assert validate_phone("no digits here") is False

    def test_empty_phone(self):
        """Test empty phone"""
        assert validate_phone("") is False


# ============================================================================
# Identification Validation Tests
# ============================================================================

class TestIdentificationValidation:
    """Test identification number validation"""

    def test_valid_cin(self):
        """Test valid CIN format"""
        assert validate_identification("AB123456", "cin") is True

    def test_invalid_cin_lowercase(self):
        """Test CIN must be uppercase"""
        assert validate_identification("ab123456", "cin") is False

    def test_valid_passport(self):
        """Test valid passport format"""
        assert validate_identification("ABC1234", "passport") is True

    def test_valid_passport_long(self):
        """Test valid passport with 9 chars"""
        assert validate_identification("ABC123456", "passport") is True

    def test_invalid_passport_too_short(self):
        """Test passport too short"""
        assert validate_identification("ABC12", "passport") is False

    def test_invalid_identification_type(self):
        """Test invalid identification type"""
        assert validate_identification("ABC123", "invalid_type") is False

    def test_empty_identification(self):
        """Test empty identification"""
        assert validate_identification("", "cin") is False


# ============================================================================
# Text Length Validation Tests
# ============================================================================

class TestTextLengthValidation:
    """Test text length validation"""

    def test_valid_length(self):
        """Test valid text length"""
        assert validate_text_length("Hello", min_length=1, max_length=100) is True

    def test_too_short(self):
        """Test text too short"""
        assert validate_text_length("Hi", min_length=10, max_length=100) is False

    def test_too_long(self):
        """Test text too long"""
        assert validate_text_length("a" * 1000, min_length=1, max_length=100) is False

    def test_exact_min_length(self):
        """Test exact minimum length"""
        assert validate_text_length("a" * 10, min_length=10, max_length=100) is True

    def test_exact_max_length(self):
        """Test exact maximum length"""
        assert validate_text_length("a" * 100, min_length=1, max_length=100) is True

    def test_non_string_input(self):
        """Test non-string input"""
        assert validate_text_length(12345, min_length=1, max_length=100) is False


# ============================================================================
# SQL Injection Detection Tests
# ============================================================================

class TestSQLInjectionDetection:
    """Test SQL injection attempt detection"""

    def test_detect_union_select(self):
        """Test UNION SELECT detection"""
        assert detect_sql_injection_attempt("admin' UNION SELECT * FROM users--") is True

    def test_detect_drop_table(self):
        """Test DROP TABLE detection"""
        assert detect_sql_injection_attempt("'; DROP TABLE patients; --") is True

    def test_detect_insert_into(self):
        """Test INSERT INTO detection"""
        assert detect_sql_injection_attempt("INSERT INTO users VALUES (...)") is True

    def test_detect_delete_from(self):
        """Test DELETE FROM detection"""
        assert detect_sql_injection_attempt("DELETE FROM patients WHERE 1=1") is True

    def test_detect_sql_comment(self):
        """Test SQL comment detection"""
        assert detect_sql_injection_attempt("password' OR '1'='1' --") is True

    def test_normal_text_safe(self):
        """Test normal text is safe"""
        assert detect_sql_injection_attempt("John Doe") is False

    def test_legitimate_union_in_text(self):
        """Test legitimate union keyword in text"""
        # Even though it contains UNION, without SELECT it should be safe
        assert detect_sql_injection_attempt("The union of sets") is False


# ============================================================================
# HTML Escaping Tests
# ============================================================================

class TestHTMLEscaping:
    """Test HTML character escaping"""

    def test_escape_ampersand(self):
        """Test ampersand escaping"""
        assert escape_html("A & B") == "A &amp; B"

    def test_escape_less_than(self):
        """Test less-than sign escaping"""
        assert escape_html("x < y") == "x &lt; y"

    def test_escape_greater_than(self):
        """Test greater-than sign escaping"""
        assert escape_html("x > y") == "x &gt; y"

    def test_escape_double_quotes(self):
        """Test double quote escaping"""
        assert escape_html('Say "hello"') == 'Say &quot;hello&quot;'

    def test_escape_single_quotes(self):
        """Test single quote escaping"""
        assert escape_html("It's") == "It&#x27;s"

    def test_escape_all_special_chars(self):
        """Test all special characters"""
        result = escape_html('<script>alert("xss")</script>')
        assert "&lt;" in result
        assert "&gt;" in result
        assert "&quot;" in result
        assert "<script>" not in result

    def test_empty_string(self):
        """Test empty string"""
        assert escape_html("") == ""


# ============================================================================
# Safe String Tests
# ============================================================================

class TestSafeString:
    """Test safe string detection"""

    def test_normal_string_safe(self):
        """Test normal string is safe"""
        assert is_safe_string("This is a normal patient note") is True

    def test_script_tag_unsafe(self):
        """Test script tag detection"""
        assert is_safe_string("<script>alert('xss')</script>") is False

    def test_event_handler_unsafe(self):
        """Test event handler detection"""
        assert is_safe_string("<img onclick='alert()'/>") is False

    def test_javascript_protocol_unsafe(self):
        """Test javascript: protocol detection"""
        assert is_safe_string("<a href='javascript:alert()'>") is False

    def test_data_url_unsafe(self):
        """Test data URL detection"""
        assert is_safe_string("data:text/html,<script>") is False

    def test_case_insensitive_detection(self):
        """Test case-insensitive detection"""
        assert is_safe_string("<SCRIPT>alert()</SCRIPT>") is False

    def test_non_string_input(self):
        """Test non-string input"""
        assert is_safe_string(12345) is False


# ============================================================================
# Integration Tests
# ============================================================================

class TestValidationIntegration:
    """Integration tests for validation functions"""

    def test_full_file_upload_flow(self):
        """Test complete file upload validation flow"""
        # Valid file
        is_valid_file, file_error = validate_file_upload(
            "scan.jpg", "image/jpeg", 1024 * 100
        )
        is_valid_name, name_error = validate_filename("scan.jpg")

        assert is_valid_file is True
        assert is_valid_name is True
        assert file_error is None
        assert name_error is None

    def test_full_text_field_flow(self):
        """Test complete text field validation flow"""
        raw_text = '  <script>alert("xss")</script>Diagnosis: Stable  '

        # Sanitize
        sanitized = sanitize_html(raw_text)
        sanitized = sanitize_text(sanitized)

        # Validate
        is_safe = is_safe_string(sanitized)
        has_valid_length = validate_text_length(sanitized, min_length=1, max_length=5000)

        assert is_safe is True
        assert has_valid_length is True
        assert "<script>" not in sanitized
