from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    model_config = {"env_file": ".env"}


settings = Settings()
