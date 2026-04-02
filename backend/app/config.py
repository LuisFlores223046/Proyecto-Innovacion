from dotenv import load_dotenv
import os

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/MapaCU")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cambia-esto-en-produccion")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_HOURS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "8"))
    MAX_LOGIN_ATTEMPTS: int = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
    LOCKOUT_MINUTES: int = int(os.getenv("LOCKOUT_MINUTES", "15"))
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")


settings = Settings()

# Alias para compatibilidad con database.py
DATABASE_URL = settings.DATABASE_URL
