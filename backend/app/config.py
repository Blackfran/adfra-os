from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    app_name: str = "AdFra Ges"
    database_url: str = "sqlite:///./adfra.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    auth_enabled: bool = True
    app_username: str = ""
    app_password: str = ""
    auth_secret: str = "change-me-adfra-secret"
    auth_token_days: int = 14
    auth_login_max_attempts: int = 8
    auth_login_window_seconds: int = 300

    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    telegram_webhook_secret: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def validate_security_settings(settings: Settings) -> None:
    """Fail closed if auth is enabled with weak/missing credentials."""
    if not settings.auth_enabled:
        return
    weak_secrets = {"", "change-me-adfra-secret", "genera-un-secreto-largo"}
    if not settings.app_username or not settings.app_password:
        raise RuntimeError("AUTH_ENABLED=true requiere APP_USERNAME y APP_PASSWORD")
    if settings.auth_secret in weak_secrets or len(settings.auth_secret) < 32:
        raise RuntimeError("AUTH_SECRET debe tener al menos 32 caracteres y no ser el valor por defecto")
