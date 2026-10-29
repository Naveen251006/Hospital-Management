import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

def detect_database_uri():
    # If explicitly set in environment
    if os.environ.get("DATABASE_URL"):
        return os.environ.get("DATABASE_URL")
    
    use_sqlite = os.environ.get("USE_SQLITE", "auto").lower()
    sqlite_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'hospital_db.sqlite')
    sqlite_uri = f"sqlite:///{sqlite_path}"
    
    if use_sqlite in ("true", "1", "yes"):
        return sqlite_uri
        
    # Check MySQL settings
    mysql_user = os.environ.get("MYSQL_USER", "root")
    mysql_password = os.environ.get("MYSQL_PASSWORD", "")
    mysql_host = os.environ.get("MYSQL_HOST", "localhost")
    mysql_port = int(os.environ.get("MYSQL_PORT", "3306"))
    mysql_db = os.environ.get("MYSQL_DB", "hospital_db")
    mysql_uri = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_db}?charset=utf8mb4"

    if use_sqlite == "false":
        return mysql_uri
        
    # In auto mode, attempt a quick ping to MySQL server
    try:
        conn = pymysql.connect(
            host=mysql_host,
            user=mysql_user,
            password=mysql_password,
            port=mysql_port,
            connect_timeout=2
        )
        # Attempt to create database if not exists
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{mysql_db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.commit()
        conn.close()
        print(f"[HMS Database] Connected to MySQL database '{mysql_db}' successfully.")
        return mysql_uri
    except Exception as e:
        print(f"[HMS Database] MySQL connection unavailable ({e}). Automatically using SQLite database for seamless development: {sqlite_path}")
        return sqlite_uri

from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "hospital-super-secret-key-2026-prod-dev")
    SQLALCHEMY_DATABASE_URI = detect_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # Production vs Demo Security Settings
    DEMO_AUTO_LOGIN = os.environ.get("DEMO_AUTO_LOGIN", "false").lower() in ("true", "1")
    DEMO_ROLE_SWITCHER = os.environ.get("DEMO_ROLE_SWITCHER", "true").lower() in ("true", "1")

    # Session Cookie Hardening
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "false").lower() in ("true", "1")
    PERMANENT_SESSION_LIFETIME = timedelta(hours=4)

    # Security Upload & Request Payload Limit (16 MB)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

