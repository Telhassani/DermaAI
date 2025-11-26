import sqlite3
import os

def drop_all_objects():
    db_path = '/Users/tariq/Applications/DermaAI/backend/test.db'
    print(f"Connecting to database at: {db_path}")
    if not os.path.exists(db_path):
        print("Database file not found!")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Disable foreign keys
        cursor.execute("PRAGMA foreign_keys = OFF")
        
        # Drop Views
        cursor.execute("SELECT name FROM sqlite_master WHERE type='view'")
        views = cursor.fetchall()
        for view in views:
            print(f"Dropping view {view[0]}...")
            cursor.execute(f"DROP VIEW IF EXISTS {view[0]}")
            
        # Drop Tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        for table in tables:
            table_name = table[0]
            if table_name != 'sqlite_sequence':
                print(f"Dropping table {table_name}...")
                cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
        
        conn.commit()
        print("Dropped all tables and views.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    drop_all_objects()
