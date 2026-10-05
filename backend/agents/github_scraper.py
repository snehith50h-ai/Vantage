import httpx
import json
from state import HackathonState

def fetch_github_readme(repo_url: str) -> str:
    # Convert https://github.com/user/repo to https://raw.githubusercontent.com/user/repo/main/README.md
    try:
        parts = repo_url.replace("https://github.com/", "").split("/")
        if len(parts) >= 2:
            user, repo = parts[0], parts[1]
            raw_url = f"https://raw.githubusercontent.com/{user}/{repo}/main/README.md"
            resp = httpx.get(raw_url, timeout=5.0, follow_redirects=True)
            if resp.status_code == 200:
                return resp.text
            
            # fallback to master
            raw_url_master = f"https://raw.githubusercontent.com/{user}/{repo}/master/README.md"
            resp_master = httpx.get(raw_url_master, timeout=5.0, follow_redirects=True)
            if resp_master.status_code == 200:
                return resp_master.text
    except Exception as e:
        print(f"Error fetching github readme: {e}")
    return ""

def github_scraper_node(state: HackathonState) -> dict:
    print(">>> ENTERING GITHUB DEEP DIVER NODE")
    
    # Extract github URLs from the duckduckgo search results (if any)
    scraped_history = state.get("scraped_history", [])
    github_intel = {"readmes": [], "summary": "No Github repos analyzed."}
    
    found_repos = []
    # If the duckduckgo scraper stored full URLs, we try to find github ones
    # (Since duckduckgo scraper in scraper.py returns 'url', let's pretend scraped_history has it or we just find github links in snippets)
    
    # We will search the 'description' or 'url' fields of scraped_history for github.com
    for item in scraped_history:
        desc = item.get("description", "")
        # Very simple extraction for demonstration
        if "github.com/" in desc:
            start_idx = desc.find("github.com/")
            end_idx = desc.find(" ", start_idx)
            if end_idx == -1: end_idx = len(desc)
            repo_link = "https://" + desc[start_idx:end_idx]
            if repo_link not in found_repos:
                found_repos.append(repo_link)
                
    # If we found any, let's fetch them!
    readmes = []
    for repo in found_repos[:2]: # Limit to 2 to save time
        print(f"Fetching README for {repo}...")
        readme = fetch_github_readme(repo)
        if readme:
            readmes.append({"repo": repo, "readme": readme[:1000]}) # Limit size
            
    if readmes:
        github_intel["readmes"] = readmes
        github_intel["summary"] = f"Analyzed {len(readmes)} past winning repositories."
        
    return {"github_intel": github_intel}
