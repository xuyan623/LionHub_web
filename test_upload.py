import requests, json, os

api_key = ""
try:
    with open(r"D:\web_build\data\secret_admin_credentials.json", "r", encoding="utf-8") as f:
        creds = json.load(f)
        api_key = creds.get("apiKey", "")
except Exception as e:
    print("Could not load API key:", e)

url = "http://127.0.0.1:4173/api/uploads"

# Test 1: multipart/form-data with correct headers
print("=== Test 1: multipart/form-data (correct) ===")
files = {"files": ("test.txt", b"hello world", "text/plain")}
data = {"taskId": "test_task_123", "source": "submission"}
headers = {"X-API-Key": api_key} if api_key else {}
try:
    resp = requests.post(url, data=data, files=files, headers=headers)
    print("Status:", resp.status_code)
    print("Response:", resp.text[:500])
except Exception as e:
    print("Error:", e)

# Test 2: application/json (old format, should now fail)
print("\n=== Test 2: application/json (old format) ===")
payload = {
    "taskId": "test_task_123",
    "source": "submission",
    "files": [{"name": "test.txt", "content": "aGVsbG8gd29ybGQ="}]
}
headers_json = {"X-API-Key": api_key, "Content-Type": "application/json"} if api_key else {"Content-Type": "application/json"}
try:
    resp = requests.post(url, json=payload, headers=headers_json)
    print("Status:", resp.status_code)
    print("Response:", resp.text[:500])
except Exception as e:
    print("Error:", e)

# Test 3: multipart without X-API-Key
print("\n=== Test 3: multipart without X-API-Key ===")
files2 = {"files": ("test2.txt", b"hello again", "text/plain")}
data2 = {"taskId": "test_task_456"}
try:
    resp = requests.post(url, data=data2, files=files2)
    print("Status:", resp.status_code)
    print("Response:", resp.text[:500])
except Exception as e:
    print("Error:", e)
