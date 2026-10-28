import os
from urllib.parse import quote_plus
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, computed_field

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "RetainIQ"
    APP_SECRET_KEY: str = "retainiq_dev_secret_key_8f93a102bc45df9e871234567890abcd"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # MySQL connection configuration (STRICT: MySQL ONLY)
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "retainiq_db"
    MYSQL_USER: str = "retainiq_user"
    MYSQL_PASSWORD: str = "retainiq_pass_2026!"

    # Explicit Database URLs if provided in environment
    DATABASE_URL: str | None = None
    TEST_DATABASE_URL: str | None = None

    # Application URLs
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # LLM configuration (optional)
    LLM_API_KEY: str | None = None
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_BASE_URL: str = "https://api.openai.com/v1"

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @computed_field
    @property
    def sync_database_url(self) -> str:
        """Construct safe MySQL SQLAlchemy URL with proper character encoding."""
        if self.DATABASE_URL and self.DATABASE_URL.strip():
            url = self.DATABASE_URL.strip()
            if "sqlite" in url.lower():
                raise ValueError("STRICT POLICY VIOLATION: SQLite is forbidden. RetainIQ requires MySQL Server 8.0+.")
            return url

        user_encoded = quote_plus(self.MYSQL_USER)
        pass_encoded = quote_plus(self.MYSQL_PASSWORD)
        return f"mysql+pymysql://{user_encoded}:{pass_encoded}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}?charset=utf8mb4"

    @computed_field
    @property
    def sync_test_database_url(self) -> str:
        """Construct safe MySQL test database URL."""
        if self.TEST_DATABASE_URL and self.TEST_DATABASE_URL.strip():
            url = self.TEST_DATABASE_URL.strip()
            if "sqlite" in url.lower():
                raise ValueError("STRICT POLICY VIOLATION: SQLite is forbidden. RetainIQ requires MySQL Server 8.0+.")
            return url

        user_encoded = quote_plus(self.MYSQL_USER)
        pass_encoded = quote_plus(self.MYSQL_PASSWORD)
        test_db = f"{self.MYSQL_DATABASE}_test" if not self.MYSQL_DATABASE.endswith("_test") else self.MYSQL_DATABASE
        # Prefer retainiq_test_db
        test_db_name = "retainiq_test_db"
        return f"mysql+pymysql://{user_encoded}:{pass_encoded}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{test_db_name}?charset=utf8mb4"

settings = Settings()
