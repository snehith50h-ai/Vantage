import httpx
from bs4 import BeautifulSoup
import os
import dotenv
from google import genai

dotenv.load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

def search_web_precedents(query: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        resp = httpx.get(f"https://html.duckduckgo.com/html/?q={query}", headers=headers, timeout=8.0, follow_redirects=True)
        soup = BeautifulSoup(resp.text, "html.parser")
        results = []
        for result in soup.find_all("div", class_="result__body")[:5]:
            snippet_elem = result.find("a", class_="result__snippet")
            title = result.find("h2").get_text(strip=True) if result.find("h2") else ""
            snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
            if title and snippet:
                results.append({"title": title, "snippet": snippet})
        return results
    except Exception as e:
        print("Search error:", e)
        return []

client = genai.Client(api_key=api_key)
web_results = search_web_precedents("Smart India Hackathon previous winners projects PPT")
context = "\n".join([f"Source: {r['title']} - {r['snippet']}" for r in web_results])

prompt = f"""You are a Hackathon Intelligence Agent.
We scraped live web search results for past hackathon editions:
{context}

Analyze these past editions, previous winners, and submission patterns.
Provide a 3-bullet summary of what won in previous editions and what the jury expects."""

res = client.models.generate_content(
    model="gemini-3.5-flash-lite",
    contents=prompt
)
print("Synthesized Precedent Analysis:")
print(res.text.encode("utf-8", errors="ignore").decode("utf-8"))
