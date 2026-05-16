from pathlib import Path


APP_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = APP_DIR / "dist"
DATA_DIR = APP_DIR / "data"
RUNTIME_DIR = DATA_DIR / "runtime"
DB_PATH = DATA_DIR / "lion_hub.db"
UPLOADS_DIR = DATA_DIR / "uploads"
BACKUPS_DIR = RUNTIME_DIR / "backups"
RATE_LIMIT_DB_PATH = RUNTIME_DIR / "rate_limits.db"
ADMIN_CREDENTIALS_PATH = DATA_DIR / "secret_admin_credentials.json"
INDEX_PATH = DIST_DIR / "index.html"
ROLLING_BACKUP_NAME = "lion_hub-latest.db"
MAX_BACKUP_COUNT = 24
BACKUP_INTERVAL_SECONDS = 300
ALLOWED_STATIC_EXTENSIONS = {
    ".css",
    ".gif",
    ".html",
    ".ico",
    ".jpeg",
    ".jpg",
    ".js",
    ".json",
    ".map",
    ".png",
    ".svg",
    ".txt",
    ".webp",
}
