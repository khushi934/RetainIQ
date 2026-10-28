import pytest
from sqlalchemy import text
from app.core.config import settings
from app.core.database import check_database_connection, engine

def test_mysql_connection_health():
    """Verify live connection to MySQL server and confirm no SQLite is used."""
    health = check_database_connection()
    assert health["status"] == "healthy"
    assert health["connected"] is True
    assert health["database_engine"] == "MySQL Server"
    assert "8." in health["mysql_version"] or "9." in health["mysql_version"] or "MySQL" in health["database_engine"]
    assert "sqlite" not in settings.sync_database_url.lower()

def test_mysql_tables_exist(db_session):
    """Verify that expected RetainIQ tables exist in MySQL."""
    res = db_session.execute(text("SHOW TABLES;")).scalars().all()
    assert "customers" in res
    assert "datasets" in res
    assert "data_import_jobs" in res
    assert "users" in res
    assert "workspaces" in res
    assert "retention_scenarios" in res
