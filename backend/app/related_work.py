"""Discover public references for a project using bounded web and GitHub queries."""

import asyncio
import os
import re
from datetime import datetime, timezone
from typing import Literal

import httpx
from pydantic import BaseModel

from agents.scraper import search_duckduckgo

SearchStatus = Literal["ok", "empty", "unavailable"]
GENERIC = set("""
    about across and app application are based build create design develop development example first
    for from guide have help idea implement make need open our plan platform please problem project
    prototype research related solution software system team the their this those tool use using want
    web what where which will with your hackathon student students just only simple minimum
    browser public that there through whether would could should must because also about able
    showing shows show using users should can need needs required currently existing possible
    first year one two three four days day hours hour minutes time budget paid free services
    work working works planning want wants demo doing does done into out full end new real
    we us you they them it is be to of on in at by as an or if no so all
""".split())


class Source(BaseModel):
    title: str
    url: str
    snippet: str = ""


class Repository(BaseModel):
    full_name: str
    url: str
    description: str = ""
    stars: int = 0
    language: str | None = None
    license: str | None = None
    updated_at: str | None = None
    matching_terms: list[str]


class RelatedWork(BaseModel):
    web_status: SearchStatus
    github_status: SearchStatus
    web_queries: list[str]
    github_queries: list[str]
    sources: list[Source]
    repositories: list[Repository]
    searched_at: str


def search_keywords(value: str) -> list[str]:
    # Public queries use short domain keywords. Remove URLs, emails, and numeric IDs.
    cleaned = re.sub(r"https?://\S+|[\w.+-]+@[\w.-]+|\b\d[\w-]*\b", " ", value, flags=re.IGNORECASE)
    return list(dict.fromkeys(
        word for word in re.findall(r"[^\W\d_]{2,25}", cleaned.casefold())
        if word not in GENERIC
    ))


def search_queries(problem: str, title: str, topics: list[str]) -> tuple[list[str], list[str], list[str]]:
    phrases = [terms[:5] for topic in [*topics, title] if (terms := search_keywords(topic))]
    problem_terms = search_keywords(problem)
    primary = phrases[0] if phrases else problem_terms[:4]
    if not primary:
        return [], [], []
    secondary = next((terms for terms in phrases[1:] if len(set(terms) - set(primary)) >= 1), [])
    reference_terms = list(dict.fromkeys([*primary, *secondary, *problem_terms[:10]]))
    web = [" ".join(primary) + " examples implementation"]
    if secondary:
        web.append(" ".join(secondary) + " documentation case study")
    elif len(primary) >= 2:
        web.append(" ".join(primary[:3]) + " open source project")
    github = list(dict.fromkeys([
        " ".join(primary[:3]) + " in:name,description",
        " ".join((secondary or primary)[:2]) + " in:name,description,readme",
    ]))
    public_qualifiers = " is:public archived:false fork:false"
    return web, [query + public_qualifiers for query in github], reference_terms


async def search_web(queries: list[str]) -> tuple[SearchStatus, list[Source]]:
    batches = await asyncio.gather(
        *(asyncio.to_thread(search_duckduckgo, query, max_results=5, strict=True) for query in queries),
        return_exceptions=True,
    )
    results: dict[str, Source] = {}
    available = not queries
    for batch in batches:
        if isinstance(batch, BaseException):
            continue
        available = True
        for item in batch:
            source = Source.model_validate(item)
            results.setdefault(source.url.rstrip("/"), source)
    sources = list(results.values())[:8]
    return ("ok" if sources else "empty" if available else "unavailable"), sources


def parse_repository(item: dict, terms: list[str]) -> Repository | None:
    name = item.get("full_name", "")
    if not isinstance(name, str) or not re.fullmatch(r"[\w.-]+/[\w.-]+", name) or any(
        part in {".", ".."} for part in name.split("/")
    ):
        return None
    if item.get("private") or item.get("archived") or item.get("fork"):
        return None
    description = item.get("description") or ""
    topics = item.get("topics") or []
    matched = set(search_keywords(" ".join([name, description, *topics])))
    license_id = (item.get("license") or {}).get("spdx_id")
    return Repository(
        full_name=name,
        url=f"https://github.com/{name}",
        description=description[:500],
        stars=item.get("stargazers_count") or 0,
        language=item.get("language"),
        license=license_id if license_id != "NOASSERTION" else None,
        updated_at=item.get("pushed_at") or item.get("updated_at"),
        matching_terms=[term for term in terms if term in matched][:5],
    )


async def search_github(queries: list[str], terms: list[str]) -> tuple[SearchStatus, list[Repository], list[str]]:
    if not queries:
        return "empty", [], []
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Vantage-Related-Work",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token := os.getenv("GITHUB_TOKEN"):
        headers["Authorization"] = f"Bearer {token}"
    used = []
    available = False

    async with httpx.AsyncClient(timeout=7.0, headers=headers) as client:
        for query in queries:
            used.append(query)
            try:
                response = await client.get(
                    "https://api.github.com/search/repositories",
                    params={"q": query, "per_page": 10},
                )
                response.raise_for_status()
                page = response.json()
                items = page["items"]
                if not isinstance(items, list):
                    break
                available = True
            except (httpx.HTTPError, ValueError, KeyError, TypeError):
                # A second query will not fix a quota, authentication or network failure.
                break
            results = [repo for item in items if isinstance(item, dict) and (repo := parse_repository(item, terms))]
            if results:
                results.sort(key=lambda repo: len(repo.matching_terms), reverse=True)
                return "ok", results[:6], used

    return ("empty" if available and len(used) == len(queries) else "unavailable"), [], used


async def discover_related_work(problem: str, title: str = "", topics: list[str] | None = None) -> RelatedWork:
    web_queries, github_queries, terms = search_queries(problem, title, topics or [])
    (web_status, sources), (github_status, repositories, used) = await asyncio.gather(
        search_web(web_queries),
        search_github(github_queries, terms),
    )
    return RelatedWork(
        web_status=web_status, github_status=github_status, web_queries=web_queries, github_queries=used,
        sources=sources, repositories=repositories, searched_at=datetime.now(timezone.utc).isoformat(),
    )
