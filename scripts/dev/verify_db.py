from pathlib import Path
import json
import sqlite3

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DB_PATH = PROJECT_ROOT / "data" / "lion_hub.db"

connection = sqlite3.connect(DB_PATH)
row = connection.execute("SELECT version, database_json FROM app_state WHERE id = 1").fetchone()
print("DB version:", row[0])
database = json.loads(row[1])
print("Users:", len(database.get("users", [])))
print("Members:", len(database.get("members", [])))
print("Tasks:", len(database.get("tasks", [])))
print("Approvals:", len(database.get("approvals", [])))
print("Settings:", json.dumps(database.get("settings", {})))
for user in database.get("users", []):
    if user.get("email", "").startswith("test_"):
        print(f"  Test user found: {user['email']} status={user.get('status')}")
if database.get("users"):
    print("First user keys:", list(database["users"][0].keys()) if database["users"] else "empty")
connection.close()
