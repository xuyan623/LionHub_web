from __future__ import annotations

import hashlib
import json
import mimetypes
import re
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.config import (
    ADMIN_CREDENTIALS_PATH,
    ALLOWED_STATIC_EXTENSIONS,
    APP_DIR,
    BACKUPS_DIR,
    DB_PATH,
    DIST_DIR,
    INDEX_PATH,
    RATE_LIMIT_DB_PATH,
    UPLOADS_DIR,
)
from backend.files import (
    prune_empty_parent_directories,
    sanitize_directory_name,
    sanitize_filename,
    sanitize_relative_storage_path,
)
from backend.schemas import AttachmentDeletePayload, DatabasePayload, PersistenceConflictError, RegisterPayload
from backend.store import SharedDatabaseStore


app = FastAPI(title="Lion Hub Local Server")
app.add_middleware(
    GZipMiddleware,
    minimum_size=1024,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
store = SharedDatabaseStore(DB_PATH)

# Rate limiting config
_RATE_LIMIT_WINDOW = 60
_RATE_LIMIT_MAX_REQUESTS = 120


def _ensure_rate_limit_schema(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS rate_limits (
            ip TEXT PRIMARY KEY,
            timestamps TEXT NOT NULL,
            updated_at REAL NOT NULL
        )
        """
    )


def _prune_rate_limits(connection: sqlite3.Connection) -> None:
    now = time.time()
    cutoff = now - _RATE_LIMIT_WINDOW * 2
    connection.execute("DELETE FROM rate_limits WHERE updated_at < ?", (cutoff,))


def _check_rate_limit(ip: str) -> bool:
    now = time.time()
    cutoff = now - _RATE_LIMIT_WINDOW
    try:
        RATE_LIMIT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(RATE_LIMIT_DB_PATH) as conn:
            _ensure_rate_limit_schema(conn)
            _prune_rate_limits(conn)
            row = conn.execute(
                "SELECT timestamps FROM rate_limits WHERE ip = ?",
                (ip,)
            ).fetchone()
            if row:
                try:
                    timestamps = [float(t) for t in json.loads(row[0]) if float(t) > cutoff]
                except (json.JSONDecodeError, ValueError):
                    timestamps = []
            else:
                timestamps = []
            if len(timestamps) >= _RATE_LIMIT_MAX_REQUESTS:
                return False
            timestamps.append(now)
            conn.execute(
                """
                INSERT INTO rate_limits (ip, timestamps, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(ip) DO UPDATE SET timestamps = excluded.timestamps, updated_at = excluded.updated_at
                """,
                (ip, json.dumps(timestamps), now)
            )
            conn.commit()
            return True
    except sqlite3.Error as error:
        print(f"Rate limit DB error: {error}")
        return True


CACHE_CONTROL_NO_CACHE = "no-cache, no-store, must-revalidate"
CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable"
CACHE_CONTROL_REVALIDATE = "public, max-age=0, must-revalidate"
HASHED_ASSET_PATH = re.compile(r"^assets/.+-[A-Z0-9]{8,}\.[a-z0-9]+$")
PRECOMPRESSIBLE_EXTENSIONS = {".css", ".html", ".js", ".json", ".map", ".svg", ".txt"}

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _make_static_response(file_path: Path, request: Request | None = None) -> FileResponse:
    serve_path, content_encoding = _select_static_variant(
        file_path,
        request.headers.get("accept-encoding", "") if request is not None else "",
    )
    media_type, _ = mimetypes.guess_type(file_path.name)
    response = FileResponse(serve_path, media_type=media_type)
    response.headers["Cache-Control"] = _get_cache_control(file_path)
    response.headers["Vary"] = "Accept-Encoding"
    if content_encoding:
        response.headers["Content-Encoding"] = content_encoding
    for header, value in SECURITY_HEADERS.items():
        response.headers.setdefault(header, value)
    return response


def _select_static_variant(file_path: Path, accept_encoding: str) -> tuple[Path, str | None]:
    if file_path.suffix.lower() not in PRECOMPRESSIBLE_EXTENSIONS:
        return file_path, None

    normalized = accept_encoding.lower()
    brotli_path = file_path.with_name(f"{file_path.name}.br")
    gzip_path = file_path.with_name(f"{file_path.name}.gz")

    if "br" in normalized and brotli_path.is_file():
        return brotli_path, "br"
    if "gzip" in normalized and gzip_path.is_file():
        return gzip_path, "gzip"
    return file_path, None


def _get_cache_control(file_path: Path) -> str:
    try:
        relative_path = file_path.resolve().relative_to(DIST_DIR.resolve()).as_posix()
    except ValueError:
        return CACHE_CONTROL_NO_CACHE

    if relative_path in {"index.html", "sw.js", "manifest.json"}:
        return CACHE_CONTROL_NO_CACHE

    if HASHED_ASSET_PATH.match(relative_path):
        return CACHE_CONTROL_IMMUTABLE

    return CACHE_CONTROL_REVALIDATE


def _load_api_key() -> str:
    try:
        creds = json.loads(ADMIN_CREDENTIALS_PATH.read_text(encoding="utf-8"))
        return creds.get("apiKey", "")
    except (OSError, json.JSONDecodeError):
        return ""


def _validate_api_key(request: Request) -> bool:
    expected = _load_api_key()
    if not expected:
        return True
    provided = request.headers.get("X-API-Key", "")
    return provided == expected


def _verify_password(password: str, password_hash: str) -> bool:
    # 兼容明文与 SHA-256 两种存储方式
    if password == password_hash:
        return True
    return hashlib.sha256(password.encode("utf-8")).hexdigest() == password_hash


class AuthPayload(BaseModel):
    email: str
    password: str


@app.post("/api/auth")
def authenticate(payload: AuthPayload, request: Request) -> dict:
    if not _check_rate_limit(_get_client_ip(request)):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后重试。")
    snapshot = store.load_snapshot()
    if not snapshot or not snapshot.get("database"):
        raise HTTPException(status_code=401, detail="系统尚未准备完成，请稍后再试。")
    database = snapshot["database"]
    user = None
    for u in database.get("users", []):
        if u.get("email") == payload.email:
            user = u
            break
    if not user or not _verify_password(payload.password, user.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="邮箱或密码错误。")
    api_key = _load_api_key()
    return {
        "userId": user["id"],
        "status": user.get("status", "pending"),
        "apiKey": api_key,
    }


@app.post("/api/register")
def register_user(payload: RegisterPayload, request: Request) -> dict:
    if not _check_rate_limit(_get_client_ip(request)):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后重试。")
    snapshot = store.load_snapshot()
    if not snapshot or not snapshot.get("database"):
        raise HTTPException(status_code=401, detail="系统尚未准备完成，请稍后再试。")
    database = snapshot["database"]

    email = payload.email.strip().lower()
    for user in database.get("users", []):
        if user.get("email", "").lower() == email:
            raise HTTPException(status_code=400, detail="该邮箱已被注册，请直接登录。")

    from uuid import uuid4
    from datetime import datetime, timezone

    user_id = f"user_{uuid4().hex[:12]}"
    member_id = f"member_{uuid4().hex[:12]}"
    approval_id = f"approval_{uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    new_user = {
        "id": user_id,
        "memberId": member_id,
        "username": payload.username.strip(),
        "email": email,
        "passwordHash": payload.password,
        "status": "pending",
        "createdAt": now,
        "lastLoginAt": None,
    }

    new_member = {
        "id": member_id,
        "userId": user_id,
        "name": payload.name.strip(),
        "avatar": "",
        "phone": payload.phone.strip(),
        "identity": "seedling",
        "role": "member",
        "departments": [payload.department.strip()],
        "directions": [],
        "robotGroups": [],
        "positions": [],
        "skillTags": payload.skillTags,
        "joinDate": now,
        "memberStatus": "pending_review",
        "bio": payload.bio.strip() or "待审核新成员",
    }

    new_approval = {
        "id": approval_id,
        "type": "registration",
        "targetId": member_id,
        "submitterId": member_id,
        "approverId": None,
        "status": "pending",
        "comment": "新成员注册申请",
        "createdAt": now,
        "reviewedAt": None,
    }

    database["users"].append(new_user)
    database["members"].append(new_member)
    database["approvals"].append(new_approval)

    try:
        saved = store.save_snapshot(database, snapshot["version"])
    except PersistenceConflictError as error:
        raise HTTPException(
            status_code=409,
            detail=f"共享数据版本冲突，服务器当前版本为 {error.current_version}。",
        ) from error

    api_key = _load_api_key()
    return {
        "userId": user_id,
        "memberId": member_id,
        "status": "pending",
        "apiKey": api_key,
    }


@app.get("/api/health")
def healthcheck(request: Request) -> dict[str, str]:
    if not _check_rate_limit(_get_client_ip(request)):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后重试。")
    return {
        "status": "ok",
        "storage": str(DB_PATH),
        "uploads": str(UPLOADS_DIR),
        "backups": str(BACKUPS_DIR),
    }


@app.get("/api/database")
def get_database(request: Request) -> dict:
    if not _check_rate_limit(_get_client_ip(request)):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后重试。")
    snapshot = store.load_snapshot()
    if snapshot is None:
        return {
            "database": None,
            "version": 0,
            "updatedAt": None,
        }
    return snapshot


@app.get("/api/database/diff")
def get_database_diff(from_version: int = 0, request: Request = None) -> dict:
    if not _check_rate_limit(_get_client_ip(request)):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后重试。")
    diff_result = store.load_diff(from_version)
    if diff_result.get("full"):
        snapshot = store.load_snapshot()
        return snapshot or {"database": None, "version": 0, "updatedAt": None}
    return diff_result


@app.put("/api/database")
def save_database(payload: DatabasePayload, request: Request) -> dict:
    if not _validate_api_key(request):
        raise HTTPException(status_code=401, detail="登录状态已失效，请重新登录后再试。")
    if not _check_rate_limit(_get_client_ip(request)):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后重试。")
    try:
        return store.save_snapshot(payload.database, payload.version)
    except PersistenceConflictError as error:
        raise HTTPException(
            status_code=409,
            detail=f"共享数据版本冲突，服务器当前版本为 {error.current_version}。",
        ) from error


UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024
UPLOAD_MAX_FILE_COUNT = 5


@app.post("/api/uploads")
def upload_files(
    request: Request,
    taskId: str = Form(...),
    source: str = Form(default="submission"),
    files: list[UploadFile] = File(...),
) -> dict:
    if not _validate_api_key(request):
        raise HTTPException(status_code=401, detail="登录状态已失效，请重新登录后再试。")
    if not _check_rate_limit(_get_client_ip(request)):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后重试。")
    task_id = taskId.strip()
    if not task_id:
        raise HTTPException(status_code=400, detail="任务信息缺失，请返回任务页后重试。")
    if not files:
        raise HTTPException(status_code=400, detail="至少上传一个附件。")
    if len(files) > UPLOAD_MAX_FILE_COUNT:
        raise HTTPException(status_code=400, detail=f"单次上传最多 {UPLOAD_MAX_FILE_COUNT} 个文件。")
    normalized_source = source if source in {"submission", "progress", "promotion"} else "submission"

    task_directory = UPLOADS_DIR / sanitize_directory_name(task_id)
    task_directory.mkdir(parents=True, exist_ok=True)
    saved_attachments: list[dict[str, str]] = []

    for upload_file in files:
        content = upload_file.file.read()
        if len(content) > UPLOAD_MAX_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"附件 {upload_file.filename} 超过单文件 5MB 限制，请压缩后重新上传。",
            )

        original_name = Path(upload_file.filename).name
        safe_name = sanitize_filename(original_name)
        saved_name = f"{uuid4().hex}-{safe_name}"
        saved_path = task_directory / saved_name

        saved_path.write_bytes(content)

        relative_path = saved_path.relative_to(UPLOADS_DIR).as_posix()
        saved_attachments.append(
            {
                "id": f"attachment_{uuid4().hex[:12]}",
                "name": original_name,
                "url": f"/uploads/{relative_path}",
                "storagePath": relative_path,
                "storage": "local",
                "source": normalized_source,
                "uploadedAt": datetime.now(timezone.utc).isoformat(),
            }
        )

    return {"attachments": saved_attachments}


@app.get("/api/uploads")
def list_uploaded_files(request: Request) -> dict:
    if not _check_rate_limit(_get_client_ip(request)):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后重试。")
    file_list: list[dict] = []
    if not UPLOADS_DIR.is_dir():
        return {"files": file_list}
    for file_path in UPLOADS_DIR.rglob("*"):
        if not file_path.is_file():
            continue
        stat = file_path.stat()
        file_list.append({
            "path": file_path.relative_to(UPLOADS_DIR).as_posix(),
            "name": file_path.name,
            "size": stat.st_size,
            "modifiedAt": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        })
    return {"files": file_list}


@app.post("/api/uploads/delete")
def delete_uploaded_files(payload: AttachmentDeletePayload, request: Request) -> dict:
    if not _validate_api_key(request):
        raise HTTPException(status_code=401, detail="登录状态已失效，请重新登录后再试。")
    if not _check_rate_limit(_get_client_ip(request)):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后重试。")
    deleted_paths: list[str] = []

    for relative_path in payload.paths:
        sanitized_relative_path = sanitize_relative_storage_path(relative_path)
        file_path = (UPLOADS_DIR / sanitized_relative_path).resolve()
        if not file_path.is_file():
            continue
        file_path.unlink(missing_ok=True)
        deleted_paths.append(sanitized_relative_path)
        prune_empty_parent_directories(file_path.parent)
    return {"deletedPaths": deleted_paths}


@app.get("/uploads/{requested_path:path}", include_in_schema=False)
def serve_uploaded_file(requested_path: str, downloadName: str | None = None) -> FileResponse:
    relative_path = sanitize_relative_storage_path(requested_path)
    candidate_path = (UPLOADS_DIR / relative_path).resolve()
    try:
        candidate_path.relative_to(UPLOADS_DIR.resolve())
    except ValueError as error:
        raise HTTPException(status_code=404, detail="Not found") from error

    if not candidate_path.is_file():
        raise HTTPException(status_code=404, detail="Not found")

    response_filename = Path(downloadName).name if downloadName else candidate_path.name
    media_type, _ = mimetypes.guess_type(response_filename)
    return FileResponse(candidate_path, filename=response_filename, media_type=media_type)


@app.get("/", include_in_schema=False)
def serve_index(request: Request) -> FileResponse:
    if not INDEX_PATH.is_file():
        raise HTTPException(status_code=503, detail="页面资源暂未准备完成，请稍后再试。")
    return _make_static_response(INDEX_PATH, request)


@app.get("/{requested_path:path}", include_in_schema=False)
def serve_static_asset(requested_path: str, request: Request) -> FileResponse:
    if requested_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")

    if not requested_path:
        return serve_index(request)

    candidate_path = (DIST_DIR / requested_path).resolve()
    try:
        candidate_path.relative_to(DIST_DIR.resolve())
    except ValueError as error:
        raise HTTPException(status_code=404, detail="Not found") from error

    if candidate_path.is_file():
        if candidate_path.suffix.lower() in ALLOWED_STATIC_EXTENSIONS:
            return _make_static_response(candidate_path, request)

    if not INDEX_PATH.is_file():
        raise HTTPException(status_code=503, detail="页面资源暂未准备完成，请稍后再试。")
    return _make_static_response(INDEX_PATH, request)
