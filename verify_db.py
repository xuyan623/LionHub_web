import sqlite3, json
conn = sqlite3.connect('data/lion_hub.db')
row = conn.execute("SELECT version, database_json FROM app_state WHERE id = 1").fetchone()
print("DB version:", row[0])
db = json.loads(row[1])
print("Users:", len(db.get("users", [])))
print("Members:", len(db.get("members", [])))
print("Tasks:", len(db.get("tasks", [])))
print("Approvals:", len(db.get("approvals", [])))
print("Settings:", json.dumps(db.get("settings", {})))
# Check for any test_ users
for u in db.get("users", []):
    if u.get("email","").startswith("test_"):
        print(f"  Test user found: {u['email']} status={u.get('status')}")
# Check users array structure
if db.get("users"):
    print("First user keys:", list(db["users"][0].keys()) if db["users"] else "empty")
# Check app_state version
conn.close()