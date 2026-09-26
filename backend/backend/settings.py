import enum

from pydantic_settings import BaseSettings, SettingsConfigDict
from yarl import URL


class LogLevel(enum.StrEnum):
    """Possible log levels."""

    NOTSET = "NOTSET"
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    FATAL = "FATAL"


class Settings(BaseSettings):
    """
    Application settings.

    These parameters can be configured
    with environment variables.
    """

    host: str = "127.0.0.1"
    port: int = 3000
    # quantity of workers for uvicorn
    workers_count: int = 1
    # Enable uvicorn reloading
    reload: bool = False

    log_level: LogLevel = LogLevel.INFO
    # Variables for the database
    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "ozon_fbs_sandbox"
    db_pass: str = "ozon_fbs_sandbox"  # noqa: S105
    db_base: str = "ozon_fbs_sandbox"
    db_echo: bool = False

    @property
    def db_url(self) -> URL:
        """
        Assemble database URL from settings.

        Returns:
            Database URL.
        """
        return URL.build(
            scheme="postgresql+asyncpg",
            host=self.db_host,
            port=self.db_port,
            user=self.db_user,
            password=self.db_pass,
            path=f"/{self.db_base}",
        )

    # extra="ignore": backend/.env is shared with scripts/fetch_ozon_fixture.py
    # and carries script-only OZON_CLIENT_ID/OZON_API_KEY keys without the
    # BACKEND_ prefix - with extra="forbid" the app fails to start
    # (extra_forbidden). Trade-off: a typo in BACKEND_* is silently dropped
    # and the default value is used instead.
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="BACKEND_",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
