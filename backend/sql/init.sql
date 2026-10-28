-- ==============================================================================
-- RETAINIQ DATABASE INITIALIZATION SCRIPT
-- Target: MySQL Server 8.0+
-- Description: Creates application and test databases and grants permissions
--              to dedicated application user 'retainiq_user'.
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS retainiq_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS retainiq_test_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- Dedicated application user
CREATE USER IF NOT EXISTS 'retainiq_user'@'localhost' IDENTIFIED BY 'retainiq_pass_2026!';
CREATE USER IF NOT EXISTS 'retainiq_user'@'%' IDENTIFIED BY 'retainiq_pass_2026!';
ALTER USER 'retainiq_user'@'localhost' IDENTIFIED BY 'retainiq_pass_2026!';
ALTER USER 'retainiq_user'@'%' IDENTIFIED BY 'retainiq_pass_2026!';

GRANT ALL PRIVILEGES ON retainiq_db.* TO 'retainiq_user'@'localhost';
GRANT ALL PRIVILEGES ON retainiq_db.* TO 'retainiq_user'@'%';

GRANT ALL PRIVILEGES ON retainiq_test_db.* TO 'retainiq_user'@'localhost';
GRANT ALL PRIVILEGES ON retainiq_test_db.* TO 'retainiq_user'@'%';

FLUSH PRIVILEGES;
