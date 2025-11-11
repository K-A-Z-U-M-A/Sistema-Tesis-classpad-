-- Run this SQL script to create attendance tables
-- Connect to your database and execute: psql -U postgres -d classpad_bd -f run-attendance-migration.sql

\echo 'Creating attendance system tables...'

-- Read and execute the migration
\i src/migrations/012_create_attendance_system.sql

\echo 'Attendance system tables created successfully!'

