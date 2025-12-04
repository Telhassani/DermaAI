#!/bin/bash
# Start backend with clean environment for SQLite development

cd /Users/tariq/Applications/DermaAI/backend

# Unset PostgreSQL DATABASE_URL if set
unset DATABASE_URL

# Activate virtual environment
source venv/bin/activate

# Start uvicorn
uvicorn app.main:app --reload --port 8000
