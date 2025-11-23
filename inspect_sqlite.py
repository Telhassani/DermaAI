import sys
from sqlalchemy import create_engine, text

DATABASE_URL = "sqlite:///./backend/test.db"

def inspect_sqlite():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            # Check users
            print("--- Users ---")
            result = connection.execute(text("SELECT id, email, is_active FROM users"))
            for row in result:
                print(row)
            
            # Check consultation_images (to confirm it's the same DB I saw earlier)
            # Note: The table might not exist if migration wasn't run on this DB
            print("\n--- Tables ---")
            result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            for row in result:
                print(row)

    except Exception as e:
        print(f"Error inspecting SQLite: {e}")

if __name__ == "__main__":
    inspect_sqlite()
