from __future__ import annotations

import hashlib
import json
import secrets
import string
from datetime import datetime, timezone
from typing import Any

from .config import ADMIN_CREDENTIALS_PATH

ADMIN_ACCOUNT_NAME = "系统管理员"
ADMIN_ACCOUNT_BIO = "站点隐藏管理员账号，仅用于系统初始化与全局管理。"
ADMIN_ACCOUNT_EMAIL_DOMAIN = "liondance.local"
PASSWORD_ALPHABET = string.ascii_letters + string.digits + "!@#$%^&*-_=+"
API_KEY_ALPHABET = string.ascii_letters + string.digits


def build_initial_database() -> dict[str, Any]:
    credentials = ensure_secret_admin_credentials()
    created_at = credentials["createdAt"]
    admin_user = {
        "id": "user_site_admin",
        "memberId": "shadow_site_admin",
        "username": credentials["username"],
        "email": credentials["email"],
        "passwordHash": credentials["password"],
        "status": "active",
        "createdAt": created_at,
        "lastLoginAt": None,
        "name": ADMIN_ACCOUNT_NAME,
        "identity": "captain",
        "role": "admin",
        "phone": "",
        "departments": ["管理层"],
        "directions": [],
        "robotGroups": [],
        "positions": ["系统管理员"],
        "skillTags": [],
        "bio": ADMIN_ACCOUNT_BIO,
        "hiddenFromDirectory": True,
    }
    return {
        "version": 1,
        "users": [admin_user],
        "members": [{
            "id": "shadow_site_admin",
            "userId": "user_site_admin",
            "name": ADMIN_ACCOUNT_NAME,
            "avatar": "",
            "phone": "",
            "identity": "captain",
            "role": "admin",
            "departments": ["管理层"],
            "directions": [],
            "robotGroups": [],
            "positions": ["系统管理员"],
            "skillTags": [],
            "joinDate": created_at,
            "memberStatus": "normal",
            "bio": ADMIN_ACCOUNT_BIO,
            "hiddenFromDirectory": True,
        }],
        "tasks": [],
        "taskParticipants": [],
        "approvals": [],
        "pointTransactions": [],
        "notifications": [],
        "robotProjects": [],
        "settings": {
            "middleJoinDiscount": 0.5,
            "pointPrecision": 1,
            "allowLeaveClaim": True,
            "hardTaskNeedsApproval": True,
        },
    }


def ensure_secret_admin_credentials() -> dict[str, str]:
    existing_credentials = read_secret_admin_credentials()
    if existing_credentials is not None:
        return existing_credentials

    created_at = datetime.now(timezone.utc).isoformat()
    suffix = secrets.token_hex(4)
    credentials = {
        "username": f"site_admin_{suffix}",
        "email": f"site-admin-{suffix}@{ADMIN_ACCOUNT_EMAIL_DOMAIN}",
        "password": generate_secret_password(24),
        "createdAt": created_at,
        "apiKey": generate_api_key(32),
    }
    ADMIN_CREDENTIALS_PATH.parent.mkdir(parents=True, exist_ok=True)
    ADMIN_CREDENTIALS_PATH.write_text(
        json.dumps(credentials, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return credentials


def read_secret_admin_credentials() -> dict[str, str] | None:
    if not ADMIN_CREDENTIALS_PATH.is_file():
        return None
    try:
        credentials = json.loads(ADMIN_CREDENTIALS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None

    required_fields = ("username", "email", "password", "createdAt")
    if not all(isinstance(credentials.get(field), str) and credentials[field].strip() for field in required_fields):
        return None
    if "apiKey" not in credentials or not isinstance(credentials.get("apiKey"), str):
        credentials["apiKey"] = generate_api_key(32)
        ADMIN_CREDENTIALS_PATH.write_text(
            json.dumps(credentials, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    return credentials


def generate_secret_password(length: int) -> str:
    return "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(length))


def generate_api_key(length: int) -> str:
    return "".join(secrets.choice(API_KEY_ALPHABET) for _ in range(length))


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()
