import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Database URL (assuming default from config or common setup)
# I'll try to read it from env or default
DATABASE_URL = "sqlite:///./backend/test.db" # Default for dev often

def inspect_images():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT id, consultation_id, patient_id, filename, length(image_data), uploaded_at FROM consultation_images"))
            print("Images in DB:")
            for row in result:
                print(row)
    except Exception as e:
        print(f"Error inspecting DB: {e}")

if __name__ == "__main__":
    inspect_images()
