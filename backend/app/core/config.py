from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Groq (primary — free tier)
    groq_api_key:  str = ""
    groq_model:    str = "llama-3.1-8b-instant"

    # OpenAI (fallback if Groq key not set)
    openai_api_key: str = ""
    openai_model:   str = "gpt-4o-mini"

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
