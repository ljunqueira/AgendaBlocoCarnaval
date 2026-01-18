from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "local"
    database_url: str = "postgresql://agenda:agenda@localhost:5432/agenda"
    redis_url: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"


def get_settings() -> Settings:
    return Settings()
