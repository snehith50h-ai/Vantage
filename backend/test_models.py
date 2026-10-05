import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
if not key:
    print("NO API KEY")
    exit(1)

req = urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models?key=' + key)
res = urllib.request.urlopen(req)
data = json.loads(res.read())
print([m['name'] for m in data.get('models', []) if 'embedContent' in m.get('supportedGenerationMethods', [])])
