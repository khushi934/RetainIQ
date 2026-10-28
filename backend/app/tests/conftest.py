import os
import sys

# Ensure backend root is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings
from app.core.database import Base
from app.models.entities import User, Workspace

# Enforce strictly MySQL for tests (No SQLite allowed)
test_db_url = settings.sync_test_database_url
if "sqlite" in test_db_url.lower():
    raise RuntimeError("STRICT TEST POLICY: SQLite is forbidden. Tests must execute against MySQL.")

test_engine = create_engine(test_db_url, pool_pre_ping=True)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all tables in retainiq_test_db once per test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    # Optional teardown: keep tables or clean up
    # Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session() -> Session:
    """Yield an isolated database session for each test, rolling back any mutations."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def test_workspace(db_session: Session) -> Workspace:
    """Create or get a verified test workspace and owner in MySQL."""
    # Find or create test user
    user = db_session.query(User).filter(User.email == "test_analyst@retainiq.local").first()
    if not user:
        user = User(
            email="test_analyst@retainiq.local",
            hashed_password="fake_hashed_pwd",
            full_name="Test Analyst",
            role="analyst"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    # Find or create test workspace
    workspace = db_session.query(Workspace).filter(Workspace.slug == "test-workspace-auto").first()
    if not workspace:
        workspace = Workspace(
            name="Test Automated Workspace",
            slug="test-workspace-auto",
            description="Dedicated workspace for automated MySQL testing",
            owner_id=user.id,
            is_demo=False
        )
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

    return workspace

@pytest.fixture
def clean_workspace(db_session: Session, test_workspace: Workspace) -> Workspace:
    """Ensure workspace is empty of customers and datasets before a test."""
    from app.models.entities import Customer, Dataset, DataImportJob, Prediction, ModelVersion
    db_session.query(Prediction).filter(Prediction.workspace_id == test_workspace.id).delete()
    db_session.query(Customer).filter(Customer.workspace_id == test_workspace.id).delete()
    db_session.query(DataImportJob).filter(DataImportJob.workspace_id == test_workspace.id).delete()
    db_session.query(Dataset).filter(Dataset.workspace_id == test_workspace.id).delete()
    db_session.query(ModelVersion).filter(ModelVersion.workspace_id == test_workspace.id).delete()
    db_session.commit()
    return test_workspace
