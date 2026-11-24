"""Read public GitHub metadata without forwarding credentials or following redirects."""

import re

import httpx
from fastapi import HTTPException


REPO = r"([A-Za-z0-9][A-Za-z0-9-]{0,38})/([A-Za-z0-9_.-]{1,100})"


def github_repo(value: str) -> str:
    match = re.fullmatch(rf"https://github\.com/{REPO}/?", value.strip(), re.IGNORECASE)
    if not match or match[2] in {".", ".."}:
        raise ValueError("Enter a GitHub repository URL, such as https://github.com/org/repo.")
    return f"https://github.com/{match[1]}/{match[2]}"


def github_evidence_target(value: str) -> tuple[str, str, str, str]:
    match = re.fullmatch(rf"https://github\.com/{REPO}/(pull|actions/runs)/([1-9][0-9]{{0,17}})/?", value.strip())
    if not match:
        raise ValueError("Use a GitHub pull request or Actions run URL.")
    repo = github_repo(f"https://github.com/{match[1]}/{match[2]}")
    kind, number = match[3], match[4]
    return repo, kind, number, f"{repo}/{kind}/{number}"


async def read_public_github(path: str, *, params: dict | None = None, empty_repository: bool = False) -> dict | list:
    try:
        async with httpx.AsyncClient(
            base_url="https://api.github.com",
            timeout=8,
            headers={"Accept": "application/vnd.github+json", "User-Agent": "Vantage"},
        ) as client:
            response = await client.get(path, params=params)
    except httpx.RequestError:
        raise HTTPException(503, "GitHub is temporarily unreachable. Try again shortly.") from None
    if response.status_code == 409 and empty_repository:
        return []
    if response.status_code == 404:
        raise HTTPException(422, "GitHub did not return this item. Check the link and repository visibility.")
    if response.status_code in (403, 429):
        raise HTTPException(503, "GitHub's public API is temporarily rate limited. Try again shortly.")
    if response.status_code != 200:
        raise HTTPException(502, "GitHub did not return the requested information.")
    try:
        data = response.json()
    except ValueError:
        raise HTTPException(502, "GitHub returned unreadable information.") from None
    if not isinstance(data, (dict, list)):
        raise HTTPException(502, "GitHub returned unexpected information.")
    return data


async def recent_commits(repository: str) -> list[dict]:
    slug = repository.removeprefix("https://github.com/")
    data = await read_public_github(f"/repos/{slug}/commits", params={"per_page": 8}, empty_repository=True)
    if not isinstance(data, list):
        raise HTTPException(502, "GitHub returned unexpected commit information.")
    commits = []
    for item in data:
        if not isinstance(item, dict) or not re.fullmatch(r"[a-f0-9]{40}", str(item.get("sha", ""))):
            continue
        details = item.get("commit") or {}
        login = (item.get("author") or {}).get("login")
        author = details.get("author") or {}
        title = str(details.get("message") or "Commit").partition("\n")[0][:240]
        commits.append({
            "sha": item["sha"], "title": title, "author": login or author.get("name") or "Unknown author",
            "date": author.get("date"), "url": f"{repository}/commit/{item['sha']}",
        })
    return commits


async def inspect_evidence(repo: str, kind: str, number: str) -> tuple[str, str | None]:
    slug = repo.removeprefix("https://github.com/")
    if kind == "pull":
        data = await read_public_github(f"/repos/{slug}/pulls/{number}")
        if not isinstance(data, dict) or data.get("state") not in {"open", "closed"}:
            raise HTTPException(502, "GitHub returned an unexpected pull request status.")
        outcome = "merged" if data.get("merged") else data["state"]
        head = data.get("head")
        sha = head.get("sha") if isinstance(head, dict) else None
    else:
        data = await read_public_github(f"/repos/{slug}/actions/runs/{number}")
        if not isinstance(data, dict) or not data.get("status"):
            raise HTTPException(502, "GitHub returned an unexpected Actions status.")
        if data["status"] != "completed":
            outcome = "pending"
        else:
            outcome = {"success": "passed", "failure": "failed", "timed_out": "failed"}.get(
                data.get("conclusion"), "inconclusive"
            )
        sha = data.get("head_sha")
    return outcome, sha if isinstance(sha, str) and re.fullmatch(r"[a-f0-9]{40}", sha) else None
