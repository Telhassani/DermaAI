import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load .env
# Load .env
from pathlib import Path
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

database_url = os.getenv("DATABASE_URL")
print(f"Testing connection to: {database_url}")

try:
    engine = create_engine(database_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Connection successful!")
        print(f"Result: {result.scalar()}")
        
        # Try to query users table
        print("Attempting to query users table...")
        result = connection.execute(text("SELECT email FROM users LIMIT 1"))
        row = result.fetchone()
        if row:
            print(f"Found user: {row[0]}")
        else:
            print("No users found.")
            
except Exception as e:
    print(f"Connection failed: {e}")
    import traceback
    traceback.print_exc()
