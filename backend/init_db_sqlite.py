"""
Initialize SQLite database for DermAI development
Creates tables and seeds demo data for testing
"""

import sqlite3
from pathlib import Path
from app.core.security import get_password_hash
from datetime import datetime, timedelta

DB_PATH = "test.db"

def init_sqlite_db():
    """Initialize SQLite database with schema and demo data"""

    # Connect to SQLite database (creates if doesn't exist)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print(f"Initializing SQLite database at {DB_PATH}...")

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")

    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'doctor',
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    print("✅ Created users table")

    # Create patients table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(50),
        phone VARCHAR(20),
        email VARCHAR(255),
        identification_type VARCHAR(50),
        identification_number VARCHAR(50),
        medical_history TEXT,
        allergies TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    print("✅ Created patients table")

    # Create appointments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_date TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        recurrence_rule TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    )
    """)
    print("✅ Created appointments table")

    # Create consultations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        consultation_date TIMESTAMP NOT NULL,
        diagnosis TEXT,
        treatment_plan TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    )
    """)
    print("✅ Created consultations table")

    # Create prescriptions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        medication_name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100),
        frequency VARCHAR(100),
        duration_days INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    )
    """)
    print("✅ Created prescriptions table")

    # Create images table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        file_size INTEGER,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
    """)
    print("✅ Created images table")

    # Create lab_conversations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lab_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        lab_data TEXT,
        conversation_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    )
    """)
    print("✅ Created lab_conversations table")

    # Seed demo users
    demo_users = [
        {
            "email": "doctor@dermai.com",
            "password": "DermAI@2024",
            "full_name": "Dr. Sarah Johnson",
            "role": "doctor"
        },
        {
            "email": "assistant@dermai.com",
            "password": "DermAI@2024",
            "full_name": "Lisa Anderson",
            "role": "assistant"
        },
        {
            "email": "admin@dermai.com",
            "password": "DermAI@2024",
            "full_name": "Admin User",
            "role": "admin"
        }
    ]

    for user_data in demo_users:
        hashed_password = get_password_hash(user_data["password"])
        cursor.execute("""
        INSERT OR IGNORE INTO users (email, hashed_password, full_name, role, is_active)
        VALUES (?, ?, ?, ?, 1)
        """, (
            user_data["email"],
            hashed_password,
            user_data["full_name"],
            user_data["role"]
        ))
        print(f"✅ Seeded user: {user_data['email']}")

    # Seed demo patients
    cursor.execute("SELECT id FROM users WHERE role = 'doctor' LIMIT 1")
    doctor = cursor.fetchone()

    if doctor:
        doctor_id = doctor[0]
        demo_patients = [
            {
                "first_name": "John",
                "last_name": "Doe",
                "date_of_birth": "1980-05-15",
                "gender": "Male",
                "phone": "555-0101",
                "email": "john.doe@example.com",
                "identification_type": "CIN",
                "identification_number": "AB123456789"
            },
            {
                "first_name": "Jane",
                "last_name": "Smith",
                "date_of_birth": "1985-08-22",
                "gender": "Female",
                "phone": "555-0102",
                "email": "jane.smith@example.com",
                "identification_type": "Passport",
                "identification_number": "PASSPORT123456"
            }
        ]

        for patient_data in demo_patients:
            cursor.execute("""
            INSERT INTO patients
            (user_id, first_name, last_name, date_of_birth, gender, phone, email,
             identification_type, identification_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doctor_id,
                patient_data["first_name"],
                patient_data["last_name"],
                patient_data["date_of_birth"],
                patient_data["gender"],
                patient_data["phone"],
                patient_data["email"],
                patient_data["identification_type"],
                patient_data["identification_number"]
            ))
            print(f"✅ Seeded patient: {patient_data['first_name']} {patient_data['last_name']}")

    # Commit all changes
    conn.commit()
    conn.close()

    print("\n" + "="*50)
    print("🎉 Database initialization complete!")
    print("="*50)
    print(f"Database: {DB_PATH}")
    print("\nDemo Credentials:")
    for user in demo_users:
        print(f"  Email: {user['email']}")
        print(f"  Password: {user['password']}")
        print(f"  Role: {user['role']}")
        print()

if __name__ == "__main__":
    init_sqlite_db()
