#!/usr/bin/env python3
"""
Simple SQLite initialization without app dependencies
Creates all tables and seeds demo data
"""

import sqlite3
import hashlib
from datetime import datetime

DB_PATH = "test.db"

# Password: demo123
# Hash computed with: from app.core.security import get_password_hash; get_password_hash("demo123")
# Using Argon2id (same as application)
DEMO_PASSWORD_HASH = "$argon2id$v=19$m=65536,t=3,p=4$H2MMASAkRGgNASCkdI6x9g$MePigJMuqESeiNkkfYci2mMV0rjhzX800ntNFpWp+iE"

def hash_password(password: str) -> str:
    """Hash password using Argon2id (same as application)"""
    from argon2 import PasswordHasher
    ph = PasswordHasher()
    return ph.hash(password)

def init_sqlite_db():
    """Initialize SQLite database with all tables"""

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print(f"Initializing SQLite database at {DB_PATH}...")

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'DOCTOR',
        is_active BOOLEAN DEFAULT 1,
        is_verified BOOLEAN DEFAULT 0,
        phone VARCHAR(50),
        mfa_enabled BOOLEAN DEFAULT 0,
        mfa_secret VARCHAR(255),
        is_deleted BOOLEAN DEFAULT 0,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    print("✅ Created users table")

    # Patients table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        identification_type VARCHAR(50) NOT NULL,
        identification_number VARCHAR(50) NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        address VARCHAR(255),
        city VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'France',
        insurance_number VARCHAR(100),
        allergies TEXT,
        medical_history TEXT,
        is_deleted BOOLEAN DEFAULT 0,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    )
    """)
    print("✅ Created patients table")

    # Appointments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        doctor_id INTEGER NOT NULL,
        guest_name VARCHAR(255),
        guest_phone VARCHAR(50),
        guest_email VARCHAR(255),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        type VARCHAR(50) DEFAULT 'consultation',
        status VARCHAR(50) DEFAULT 'scheduled',
        reason TEXT,
        notes TEXT,
        diagnosis TEXT,
        is_first_visit BOOLEAN DEFAULT 0,
        reminder_sent BOOLEAN DEFAULT 0,
        recurrence_rule JSON,
        recurring_series_id INTEGER,
        is_deleted BOOLEAN DEFAULT 0,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    )
    """)
    print("✅ Created appointments table")

    # Lab conversations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lab_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL DEFAULT 'New Lab Analysis Chat',
        description TEXT,
        default_model VARCHAR(100),
        system_prompt TEXT,
        temperature FLOAT DEFAULT 0.7,
        message_count INTEGER DEFAULT 0,
        last_message_at TIMESTAMP,
        is_pinned BOOLEAN DEFAULT 0,
        is_archived BOOLEAN DEFAULT 0,
        title_auto_generated BOOLEAN DEFAULT 0,
        original_title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    )
    """)
    print("✅ Created lab_conversations table")

    # Lab messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lab_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        model_used VARCHAR(100),
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        processing_time_ms INTEGER,
        message_type VARCHAR(50) DEFAULT 'TEXT',
        has_attachments BOOLEAN DEFAULT 0,
        is_edited BOOLEAN DEFAULT 0,
        edited_at TIMESTAMP,
        current_version_number INTEGER DEFAULT 1,
        has_versions BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES lab_conversations(id)
    )
    """)
    print("✅ Created lab_messages table")

    # Lab message versions table (for regenerated messages)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lab_message_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        version_number INTEGER NOT NULL,
        content TEXT NOT NULL,
        model_used VARCHAR(100),
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        processing_time_ms INTEGER,
        is_current BOOLEAN DEFAULT 0,
        regeneration_reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, version_number),
        FOREIGN KEY (message_id) REFERENCES lab_messages(id) ON DELETE CASCADE
    )
    """)
    print("✅ Created lab_message_versions table")

    # Prompt templates table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prompt_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        category VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        template_text TEXT NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    print("✅ Created prompt_templates table")

    # Lab message attachments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lab_message_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        file_type VARCHAR(50) NOT NULL,
        mime_type VARCHAR(100),
        is_processed BOOLEAN DEFAULT 0,
        extracted_data JSON,
        ai_analysis_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES lab_messages(id)
    )
    """)
    print("✅ Created lab_message_attachments table")

    # Consultations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        consultation_date DATE NOT NULL,
        consultation_time DATETIME NOT NULL,
        chief_complaint TEXT NOT NULL,
        symptoms TEXT,
        duration_symptoms VARCHAR(100),
        medical_history_notes TEXT,
        clinical_examination TEXT,
        dermatological_examination TEXT,
        lesion_type VARCHAR(200),
        lesion_location VARCHAR(200),
        lesion_size VARCHAR(100),
        lesion_color VARCHAR(100),
        lesion_texture VARCHAR(100),
        diagnosis TEXT,
        differential_diagnosis TEXT,
        treatment_plan TEXT,
        follow_up_required BOOLEAN DEFAULT 0,
        follow_up_date DATE,
        notes TEXT,
        private_notes TEXT,
        images_taken BOOLEAN DEFAULT 0,
        biopsy_performed BOOLEAN DEFAULT 0,
        biopsy_results TEXT,
        is_deleted BOOLEAN DEFAULT 0,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    )
    """)
    print("✅ Created consultations table")

    # Prescriptions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        medication_name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100),
        frequency VARCHAR(100),
        duration VARCHAR(100),
        instructions TEXT,
        indications TEXT,
        start_date DATE,
        end_date DATE,
        refills_allowed INTEGER DEFAULT 0,
        is_controlled_substance BOOLEAN DEFAULT 0,
        notes TEXT,
        private_notes TEXT,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        is_deleted BOOLEAN DEFAULT 0,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    )
    """)
    print("✅ Created prescriptions table")

    # Seed demo users
    try:
        cursor.execute("""
        INSERT INTO users (email, hashed_password, full_name, role, is_active, is_verified)
        VALUES (?, ?, ?, ?, ?, ?)
        """, ("admin@dermai.com", DEMO_PASSWORD_HASH, "Admin User", "ADMIN", 1, 1))
        print("✅ Created admin user")

        cursor.execute("""
        INSERT INTO users (email, hashed_password, full_name, role, is_active, is_verified)
        VALUES (?, ?, ?, ?, ?, ?)
        """, ("doctor@dermai.com", DEMO_PASSWORD_HASH, "Dr. Demo", "DOCTOR", 1, 1))
        print("✅ Created doctor user")

        cursor.execute("""
        INSERT INTO users (email, hashed_password, full_name, role, is_active, is_verified)
        VALUES (?, ?, ?, ?, ?, ?)
        """, ("assistant@dermai.com", DEMO_PASSWORD_HASH, "Assistant Demo", "ASSISTANT", 1, 1))
        print("✅ Created assistant user")

    except sqlite3.IntegrityError:
        print("⚠️ Demo users already exist, skipping seed")

    conn.commit()
    conn.close()

    print(f"\n✅ SQLite database initialized successfully!")
    print(f"📁 Database location: {DB_PATH}")
    print("\n🔐 Demo credentials:")
    print("  Email: doctor@dermai.com")
    print("  Password: demo123")

if __name__ == "__main__":
    init_sqlite_db()
