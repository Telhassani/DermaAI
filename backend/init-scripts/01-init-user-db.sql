-- Create database user and database for DermAI
CREATE USER dermai_user WITH PASSWORD 'dermai_pass_dev_only';
CREATE DATABASE dermai_db;
GRANT ALL PRIVILEGES ON DATABASE dermai_db TO dermai_user;

-- Connect to dermai_db and grant schema privileges
\c dermai_db
GRANT ALL ON SCHEMA public TO dermai_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dermai_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dermai_user;
