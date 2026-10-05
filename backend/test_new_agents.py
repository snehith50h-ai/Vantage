import httpx
import json

def test():
    url = "http://127.0.0.1:8000/api/strategize"
    payload = {
        "organizer_name": "NASA Space Apps Challenge",
        "problem_statement": "Build an app that tracks orbital debris and helps satellites avoid collisions using open data."
    }
    
    print("Sending request to backend...")
    resp = httpx.post(url, json=payload, timeout=60.0)
    
    if resp.status_code == 200:
        data = resp.json()
        print("\n=== SUCCESS ===")
        print("Received Data Keys:", data.keys())
    else:
        print(f"Failed: {resp.status_code}")
        print(resp.text)

if __name__ == "__main__":
    test()
