from pathlib import Path
import json
import requests

PROJECT_ROOT = Path(__file__).resolve().parents[2]
API_KEY_PATH = PROJECT_ROOT / "data" / "secret_admin_credentials.json"

api_key = ""
try:
    with API_KEY_PATH.open("r", encoding="utf-8") as handle:
        credentials = json.load(handle)
        api_key = credentials.get("apiKey", "")
except Exception as error:
    print("Could not load API key:", error)

url = "http://127.0.0.1:4173/api/uploads"

print("=== Test 1: multipart/form-data (correct) ===")
files = {"files": ("test.txt", b"hello world", "text/plain")}
data = {"taskId": "test_task_123", "source": "submission"}
headers = {"X-API-Key": api_key} if api_key else {}
try:
    response = requests.post(url, data=data, files=files, headers=headers)
    print("Status:", response.status_code)
    print("Response:", response.text[:500])
except Exception as error:
    print("Error:", error)

print("\n=== Test 2: application/json (old format) ===")
payload = {
    "taskId": "test_task_123",
    "source": "submission",
    "files": [{"name": "test.txt", "content": "aGVsbG8gd29ybGQ="}],
}
headers_json = {"X-API-Key": api_key, "Content-Type": "application/json"} if api_key else {"Content-Type": "application/json"}
try:
    response = requests.post(url, json=payload, headers=headers_json)
    print("Status:", response.status_code)
    print("Response:", response.text[:500])
except Exception as error:
    print("Error:", error)

print("\n=== Test 3: multipart without X-API-Key ===")
files2 = {"files": ("test2.txt", b"hello again", "text/plain")}
data2 = {"taskId": "test_task_456"}
try:
    response = requests.post(url, data=data2, files=files2)
    print("Status:", response.status_code)
    print("Response:", response.text[:500])
except Exception as error:
    print("Error:", error)
