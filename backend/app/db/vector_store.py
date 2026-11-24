"""Multimodal pgvector RAG & Retrieval Pipeline for Vantage.

Powered by:
1. Primary Text/Code Embedder: nvidia/nemotron-3-embed-1b:free (with input_type='passage' | 'query')
2. Multimodal Document Embedder: nvidia/llama-nemotron-embed-vl-1b-v2:free (visual tables, PDFs, infographics)
3. Second-Stage Cross-Encoder Reranker: nvidia/llama-nemotron-rerank-vl-1b-v2:free (top-20 rerank)
"""

from __future__ import annotations

import os
import json
import time
from typing import List, Dict, Any, Optional, Literal
import httpx
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
MODEL_TEXT_EMBEDDER = os.getenv("MODEL_TEXT_EMBEDDER", "nvidia/nemotron-3-embed-1b:free")
MODEL_MULTIMODAL_EMBEDDER = os.getenv("MODEL_MULTIMODAL_EMBEDDER", "nvidia/llama-nemotron-embed-vl-1b-v2:free")
MODEL_RERANKER = os.getenv("MODEL_RERANKER", "nvidia/llama-nemotron-rerank-vl-1b-v2:free")


async def generate_text_embedding(
    text: str,
    input_type: Literal["passage", "query"] = "passage",
    byok_openrouter: Optional[str] = None,
    byok_gemini: Optional[str] = None,
) -> List[float]:
    """Generates embeddings using nvidia/nemotron-3-embed-1b:free with task-specific input_type."""
    or_key = (byok_openrouter or os.getenv("OPENROUTER_API_KEY") or "").strip()
    gem_key = (byok_gemini or os.getenv("GEMINI_API_KEY") or "").strip()

    if or_key:
        try:
            headers = {
                "Authorization": f"Bearer {or_key}",
                "HTTP-Referer": "https://vantage.dev",
                "X-Title": "Vantage Multimodal RAG",
                "Content-Type": "application/json",
            }
            payload = {
                "model": MODEL_TEXT_EMBEDDER,
                "input": text[:8000],
                "encoding_format": "float",
                "input_type": input_type,
            }
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(f"{OPENROUTER_BASE_URL}/embeddings", json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    embedding = data["data"][0]["embedding"]
                    return embedding
        except Exception as e:
            print(f"[VectorStore] Nemotron text embedding error: {e}. Falling back.")

    # Fallback to Gemini Embeddings via REST
    if gem_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent"
            payload = {
                "model": "models/text-embedding-004",
                "content": {"parts": [{"text": text[:8000]}]},
            }
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, headers={"x-goog-api-key": gem_key}, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    values = data.get("embedding", {}).get("values", [])
                    if values:
                        return values
        except Exception as e:
            print(f"[VectorStore] Gemini embedding fallback error: {e}")

    return []


async def generate_multimodal_embedding(
    content_or_image_b64: str,
    doc_type: str = "table",
    byok_openrouter: Optional[str] = None,
) -> List[float]:
    """Embeds visual tables, sponsor architecture PDFs, and infographics using Llama Nemotron Embed VL."""
    or_key = (byok_openrouter or os.getenv("OPENROUTER_API_KEY") or "").strip()
    if or_key:
        try:
            headers = {
                "Authorization": f"Bearer {or_key}",
                "HTTP-Referer": "https://vantage.dev",
                "X-Title": "Vantage Multimodal RAG",
                "Content-Type": "application/json",
            }
            payload = {
                "model": MODEL_MULTIMODAL_EMBEDDER,
                "input": content_or_image_b64[:10000],
                "doc_type": doc_type,
            }
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(f"{OPENROUTER_BASE_URL}/embeddings", json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["data"][0]["embedding"]
        except Exception as e:
            print(f"[VectorStore] Multimodal embedding error: {e}. Falling back to text embedder.")

    return await generate_text_embedding(content_or_image_b64, input_type="passage", byok_openrouter=byok_openrouter)


async def rerank_candidates(
    query: str,
    candidates: List[Dict[str, Any]],
    top_k: int = 5,
    byok_openrouter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Takes candidate matches and applies Second-Stage Cross-Encoder Reranking for a +6-7% recall boost."""
    if not candidates or len(candidates) <= 1:
        return candidates[:top_k]

    or_key = (byok_openrouter or os.getenv("OPENROUTER_API_KEY") or "").strip()
    if or_key:
        try:
            headers = {
                "Authorization": f"Bearer {or_key}",
                "HTTP-Referer": "https://vantage.dev",
                "X-Title": "Vantage Reranker",
                "Content-Type": "application/json",
            }
            docs = [c.get("content", c.get("description", ""))[:1200] for c in candidates[:20]]
            payload = {
                "model": MODEL_RERANKER,
                "query": query[:1000],
                "documents": docs,
                "top_n": top_k,
            }
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(f"{OPENROUTER_BASE_URL}/rerank", json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    ranked_indices = [item["index"] for item in data.get("results", [])]
                    reranked = []
                    for idx in ranked_indices:
                        if idx < len(candidates):
                            cand = candidates[idx].copy()
                            cand["rerank_score"] = data["results"][ranked_indices.index(idx)].get("relevance_score", 0.0)
                            reranked.append(cand)
                    if reranked:
                        return reranked
        except Exception as e:
            print(f"[VectorStore] Cross-encoder rerank error: {e}. Using vector similarity order.")

    # Default to initial candidate order if reranker unavailable
    return candidates[:top_k]


class VectorStore:
    """Manages pgvector multimodal retrieval with cross-encoder reranking."""

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or os.getenv("DATABASE_URL")

    def get_connection(self):
        import psycopg2
        from pgvector.psycopg2 import register_vector
        conn = psycopg2.connect(self.db_url)
        try:
            register_vector(conn)
        except Exception:
            pass
        return conn

    def init_multimodal_schema(self):
        """Initializes tables for multimodal embeddings."""
        try:
            conn = self.get_connection()
            cur = conn.cursor()
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS multimodal_knowledge (
                    id SERIAL PRIMARY KEY,
                    doc_type VARCHAR(64) DEFAULT 'text',
                    organizer VARCHAR(255),
                    title VARCHAR(255),
                    content TEXT,
                    metadata_json JSONB,
                    embedding vector(1024),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            print(f"[VectorStore] Init schema note: {e}")

    async def hybrid_search_with_rerank(
        self,
        query: str,
        organizer: Optional[str] = None,
        top_k: int = 5,
        candidate_pool_size: int = 20,
        byok_openrouter: Optional[str] = None,
        byok_gemini: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Performs pgvector vector retrieval followed by cross-encoder reranking."""
        query_emb = await generate_text_embedding(
            text=query,
            input_type="query",
            byok_openrouter=byok_openrouter,
            byok_gemini=byok_gemini,
        )

        def read_candidates():
            from contextlib import closing
            with closing(self.get_connection()) as conn, conn.cursor() as cur:
                if len(query_emb) == 1024:
                    cur.execute("""
                        SELECT id, organizer, title, content FROM multimodal_knowledge
                        WHERE embedding IS NOT NULL
                        ORDER BY embedding <=> %s::vector LIMIT %s
                    """, (str(query_emb), candidate_pool_size))
                else:
                    cur.execute("""
                        SELECT id, organizer, title, content FROM multimodal_knowledge
                        WHERE to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
                              @@ plainto_tsquery('simple', %s)
                        ORDER BY created_at DESC LIMIT %s
                    """, (query, candidate_pool_size))
                return [dict(id=r[0], organizer=r[1], title=r[2], content=r[3], source="knowledge_base")
                        for r in cur.fetchall()]

        import asyncio
        candidates = await asyncio.to_thread(read_candidates)
        if not candidates:
            return []
        return await rerank_candidates(
            query=query,
            candidates=candidates,
            top_k=top_k,
            byok_openrouter=byok_openrouter,
        )


vector_store = VectorStore()


async def hybrid_search_with_rerank(
    query: str,
    organizer: Optional[str] = None,
    domain: Optional[str] = None,
    multimodal_data_url: Optional[str] = None,
    top_k: int = 5,
    byok_openrouter: Optional[str] = None,
    byok_gemini: Optional[str] = None,
    candidate_pool_size: int = 20,
) -> List[Dict[str, Any]]:
    """Convenience wrapper delegating to the singleton vector_store instance."""
    return await vector_store.hybrid_search_with_rerank(
        query=query,
        organizer=organizer,
        top_k=top_k,
        candidate_pool_size=candidate_pool_size,
        byok_openrouter=byok_openrouter,
        byok_gemini=byok_gemini,
    )

