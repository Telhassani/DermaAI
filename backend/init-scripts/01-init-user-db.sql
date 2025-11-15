-- Create database user and database for DermAI (if not already created)
-- Note: When POSTGRES_USER/POSTGRES_PASSWORD are set in docker-compose,
-- PostgreSQL automatically creates the user and initial database

-- Only create user if it doesn't exist
DO
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'dermai_user') THEN
    CREATE USER dermai_user WITH PASSWORD 'dermai_pass_dev_only';
  END IF;
END
$$;

-- Grant privileges to dermai_user on dermai_db (created automatically as POSTGRES_DB)
GRANT ALL PRIVILEGES ON DATABASE dermai_db TO dermai_user;

-- Connect to dermai_db and grant schema privileges
\c dermai_db
GRANT ALL ON SCHEMA public TO dermai_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dermai_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dermai_user;
