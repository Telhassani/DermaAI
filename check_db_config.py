import sys
import os
from dotenv import load_dotenv

# Load env vars from backend/.env
env_path = os.path.join(os.getcwd(), "backend", ".env")
load_dotenv(env_path)

database_url = os.environ.get("DATABASE_URL")
print(f"DATABASE_URL loaded from env: {database_url}")

if not database_url:
    print("DATABASE_URL is not set!")
    sys.exit(1)

try:
    from sqlalchemy import create_engine, text
    engine = create_engine(database_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Database connection successful!")
except Exception as e:
    print(f"Database connection failed: {e}")
