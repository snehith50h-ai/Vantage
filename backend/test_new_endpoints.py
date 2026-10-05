from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def test_mentor():
    print("Testing /api/mentor...")
    response = client.post("/api/mentor", json={
        "project_state": "Building an AI chat app",
        "current_code": "import tensorflow",
        "model": "gemini-3.5-flash-lite"
    })
    print("Status:", response.status_code)
    print("Response:", json.dumps(response.json(), indent=2))
    assert response.status_code == 200

def test_github():
    print("\nTesting /api/github/analyze...")
    response = client.post("/api/github/analyze", json={
        "repo_url": "https://github.com/test",
        "commits": [{"hash": "123", "message": "Initial", "author": "me"}],
        "architecture_contract": "React + Node",
        "model": "gemini-3.5-flash-lite"
    })
    print("Status:", response.status_code)
    print("Response:", json.dumps(response.json(), indent=2))
    assert response.status_code == 200

if __name__ == "__main__":
    test_mentor()
    test_github()
    print("\nAll endpoints working perfectly!")
