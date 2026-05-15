import json
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .bootstrap import build_initial_database
from .config import (
    BACKUPS_DIR,
    BACKUP_INTERVAL_SECONDS,
    DATA_DIR,
    MAX_BACKUP_COUNT,
    ROLLING_BACKUP_NAME,
    UPLOADS_DIR,
)
from .schemas import PersistenceConflictError


class SharedDatabaseStore:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self._lock = threading.Lock()
        self._last_timestamped_backup_at: datetime | None = None
        self._version_history: list[tuple[int, dict]] = []
        self._MAX_HISTORY = 50
        self._ensure_schema()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _ensure_schema(self) -> None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS app_state (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    version INTEGER NOT NULL,
                    database_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            self._ensure_initial_snapshot(connection)
            connection.commit()
            self._write_latest_backup(connection)

    def _ensure_admin_member(self, database: dict) -> None:
        if not isinstance(database.get("members"), list):
            database["members"] = []
        admin_user = None
        for user in database.get("users", []):
            if user.get("memberId") == "shadow_site_admin":
                admin_user = user
                break
        if admin_user is None:
            return
        has_member = any(m.get("id") == "shadow_site_admin" for m in database["members"])
        if has_member:
            return
        from datetime import datetime, timezone
        database["members"].append({
            "id": "shadow_site_admin",
            "userId": "user_site_admin",
            "name": admin_user.get("name", "系统管理员"),
            "avatar": "",
            "phone": admin_user.get("phone", ""),
            "identity": admin_user.get("identity", "captain"),
            "role": admin_user.get("role", "admin"),
            "departments": admin_user.get("departments", ["管理层"]),
            "directions": admin_user.get("directions", []),
            "robotGroups": admin_user.get("robotGroups", []),
            "positions": admin_user.get("positions", ["系统管理员"]),
            "skillTags": admin_user.get("skillTags", []),
            "joinDate": admin_user.get("createdAt", datetime.now(timezone.utc).isoformat()),
            "memberStatus": "normal",
            "bio": admin_user.get("bio", "系统隐藏管理员账号。"),
            "hiddenFromDirectory": True,
        })

    def load_snapshot(self) -> dict[str, Any] | None:
        with self._lock:
            with self._connect() as connection:
                self._ensure_initial_snapshot(connection)
                row = connection.execute(
                    "SELECT version, database_json, updated_at FROM app_state WHERE id = 1"
                ).fetchone()
        if row is None:
            return None
        database = json.loads(row["database_json"])
        self._ensure_admin_member(database)
        return {
            "database": database,
            "version": int(row["version"]),
            "updatedAt": row["updated_at"],
        }

    def reset_to_initial_snapshot(self) -> dict[str, Any]:
        initial_database = build_initial_database()
        serialized_database = json.dumps(initial_database, ensure_ascii=False)
        updated_at = datetime.now(timezone.utc).isoformat()

        with self._lock:
            with self._connect() as connection:
                connection.execute("DELETE FROM app_state")
                connection.execute(
                    """
                    INSERT INTO app_state (id, version, database_json, updated_at)
                    VALUES (1, 1, ?, ?)
                    """,
                    (serialized_database, updated_at),
                )
                connection.commit()
                self._last_timestamped_backup_at = None
                self._write_latest_backup(connection)
                self._write_timestamped_backup_if_needed(connection, 1)

        return {
            "database": initial_database,
            "version": 1,
            "updatedAt": updated_at,
        }

    def save_snapshot(self, database: dict[str, Any], base_version: int) -> dict[str, Any]:
        serialized_database = json.dumps(database, ensure_ascii=False)
        updated_at = datetime.now(timezone.utc).isoformat()

        with self._lock:
            with self._connect() as connection:
                row = connection.execute("SELECT version FROM app_state WHERE id = 1").fetchone()

                if row is None:
                    if base_version not in (0, None):
                        raise PersistenceConflictError(0)
                    next_version = 1
                    connection.execute(
                        """
                        INSERT INTO app_state (id, version, database_json, updated_at)
                        VALUES (1, ?, ?, ?)
                        """,
                        (next_version, serialized_database, updated_at),
                    )
                else:
                    current_version = int(row["version"])
                    if base_version != current_version:
                        raise PersistenceConflictError(current_version)
                    next_version = current_version + 1
                    connection.execute(
                        """
                        UPDATE app_state
                        SET version = ?, database_json = ?, updated_at = ?
                        WHERE id = 1
                        """,
                        (next_version, serialized_database, updated_at),
                    )

                connection.commit()
                self._write_latest_backup(connection)
                self._write_timestamped_backup_if_needed(connection, next_version)

        self._record_version(next_version, database)
        return {
            "database": database,
            "version": next_version,
            "updatedAt": updated_at,
        }

    def _record_version(self, version: int, database: dict) -> None:
        import copy
        self._version_history.append((version, copy.deepcopy(database)))
        if len(self._version_history) > self._MAX_HISTORY:
            self._version_history.pop(0)

    def load_diff(self, from_version: int) -> dict[str, Any]:
        old_database = None
        for v, db in self._version_history:
            if v == from_version:
                old_database = db
                break
        if old_database is None:
            return {"full": True}

        current = self.load_snapshot()
        if current is None:
            return {"full": True}

        return {
            "diff": self._compute_diff(old_database, current["database"]),
            "version": current["version"],
            "updatedAt": current["updatedAt"],
        }

    def _compute_diff(self, old: dict, new: dict) -> dict[str, Any]:
        diff: dict[str, Any] = {}
        collection_keys = ["users", "members", "tasks", "taskParticipants", "approvals", "pointTransactions", "notifications", "robotProjects"]
        for key in collection_keys:
            old_list = old.get(key, [])
            new_list = new.get(key, [])
            if not isinstance(old_list, list) or not isinstance(new_list, list):
                continue
            old_map = {item["id"]: item for item in old_list if isinstance(item, dict) and "id" in item}
            new_map = {item["id"]: item for item in new_list if isinstance(item, dict) and "id" in item}

            added = [new_map[id] for id in new_map if id not in old_map]
            removed = [id for id in old_map if id not in new_map]
            updated = [new_map[id] for id in new_map if id in old_map and new_map[id] != old_map[id]]
            if added or removed or updated:
                diff[key] = {"added": added, "removed": removed, "updated": updated}

        settings_old = old.get("settings", {})
        settings_new = new.get("settings", {})
        if settings_old != settings_new:
            diff["settings"] = settings_new

        return diff

    def _write_latest_backup(self, source_connection: sqlite3.Connection) -> None:
        latest_backup_path = BACKUPS_DIR / ROLLING_BACKUP_NAME
        with sqlite3.connect(latest_backup_path) as backup_connection:
            source_connection.backup(backup_connection)

    def _ensure_initial_snapshot(self, connection: sqlite3.Connection) -> None:
        row = connection.execute("SELECT 1 FROM app_state WHERE id = 1").fetchone()
        if row is not None:
            return

        initial_database = build_initial_database()
        connection.execute(
            """
            INSERT INTO app_state (id, version, database_json, updated_at)
            VALUES (1, 1, ?, ?)
            """,
            (
                json.dumps(initial_database, ensure_ascii=False),
                datetime.now(timezone.utc).isoformat(),
            ),
        )

    def _write_timestamped_backup_if_needed(self, source_connection: sqlite3.Connection, version: int) -> None:
        now = datetime.now(timezone.utc)
        if self._last_timestamped_backup_at and (now - self._last_timestamped_backup_at).total_seconds() < BACKUP_INTERVAL_SECONDS:
            return

        timestamp = now.strftime("%Y%m%d-%H%M%S")
        backup_path = BACKUPS_DIR / f"lion_hub-v{version:05d}-{timestamp}.db"
        with sqlite3.connect(backup_path) as backup_connection:
            source_connection.backup(backup_connection)

        self._last_timestamped_backup_at = now
        self._prune_old_backups()

    def _prune_old_backups(self) -> None:
        backup_files = sorted(
            (path for path in BACKUPS_DIR.glob("lion_hub-v*.db") if path.is_file()),
            key=lambda path: path.stat().st_mtime,
            reverse=True,
        )
        for stale_backup in backup_files[MAX_BACKUP_COUNT:]:
            stale_backup.unlink(missing_ok=True)
