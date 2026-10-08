# Vantage ⚡
### Autonomous AI Hackathon Strategist & Enterprise Architecture Studio

> **Transform vague problem statements into winning hackathon blueprints, production system architectures, and investor-ready pitches in seconds.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.142.2-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.8-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.2.12-FF4F00?style=flat)](https://github.com/langchain-ai/langgraph)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=flat&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev)

---

## 🌟 Overview

**Vantage** is an end-to-end multi-agent strategic intelligence platform built for hackathon teams, engineers, and founders. It orchestrates a specialized council of AI agents powered by **Google Gemini** and **LangGraph** to analyze challenge statements, benchmark existing GitHub repositories, construct enterprise-grade architectural blueprints (complete with interactive Mermaid diagrams), audit technical feasibility, and generate jury-ready pitch decks.

---

## 🤖 The Council of Agents

| Agent | Responsibility | Core Deliverable |
| :--- | :--- | :--- |
| **Principal Architect** | Senior engineering system design | Microservices topology, data flow, caching/event bus design, interactive Mermaid C4 diagram |
| **Feasibility & Tradeoffs** | Risk audit & time-to-MVP scoring | Feasibility score (0-100), MVP milestones, bottleneck mitigation, scaling limits |
| **Pitch Strategist** | Pitch & storytelling engine | 30s elevator hook, jury problem-solution fit, market TAM/SAM, competitive moat |
| **Web & GitHub Scraper** | Live competitor & repository intel | Related open-source GitHub projects, prior art, technological differentiation |
| **Jury Profiler** | Evaluation criteria alignment | Scoring matrix optimization, judging bias compensation, rubric mapping |
| **Devil's Advocate** | Critical stress testing | Edge cases, security vulnerabilities, single points of failure, counter-arguments |
| **Scrum Master** | Sprint breakdown & delivery | 24-48h hackathon task roadmap, role distribution, parallelizable epics |
| **UX Visionary** | Experience architecture | User flows, key wireframe paradigms, emotional appeal |
| **Business Strategist** | Monetization & post-event viability | Unit economics, pricing models, go-to-market strategy |

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["Next.js 16 Web Client (Turbopack + Tailwind v4)"]
    API["FastAPI Backend (Uvicorn Async Engine)"]
    Auth["JWT & Bcrypt Auth Service"]
    Persistence["Run & Item Persistence Middleware"]
    DB[("PostgreSQL 16 + pgvector")]
    
    subgraph MultiAgentEngine ["LangGraph Multi-Agent Engine"]
        Orchestrator["Graph State Router"]
        Scraper["GitHub & DuckDuckGo Intel"]
        Architect["Principal Architect Agent"]
        Feasibility["Feasibility & Tradeoffs Agent"]
        Pitch["Pitch & Storyteller Agent"]
        Specialists["Business / Scrum / UX / Devil's Advocate"]
    end

    Client <==>|REST / JSON| API
    API --> Auth
    API --> Persistence
    Persistence --> DB
    API --> Orchestrator
    Orchestrator --> Scraper
    Orchestrator --> Architect
    Orchestrator --> Feasibility
    Orchestrator --> Pitch
    Orchestrator --> Specialists
    MultiAgentEngine -->|Gemini 2.5/3.5| GeminiAPI["Google Gemini LLM"]
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js** >= 20.x
- **Python** >= 3.11
- **Docker & Docker Compose**
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/))

---

### 1. Database Setup (pgvector)
From the repository root:
```bash
docker compose up -d
```
This spins up PostgreSQL 16 with the `pgvector` extension enabled on port `5432`.

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY and JWT_SECRET

# Start the backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Start the dev server
npm run dev
```
The frontend application will be accessible at: **[http://localhost:3000](http://localhost:3000)** (or `3001` if port 3000 is occupied).

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/hackathon` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `JWT_SECRET` | Secret key for signing auth tokens | `your_secret_random_string` |
| `RESEND_API_KEY` | *(Optional)* Resend API key for reset emails | `re_123...` |
| `EMAIL_FROM` | *(Optional)* Sender email | `noreply@vantage.dev` |

### Frontend (`frontend/.env.local`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Vantage Backend base URL | `http://localhost:8000` |

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```
Or run individual test flows:
```bash
python tests/test_reset_flow.py
python tests/test_senior_engineer_blueprint.py
```

### Frontend Tests
```bash
cd frontend
node tests/test_flow.mjs
node tests/test_reset_frontend.mjs
```

---

## 📂 Project Structure

```
Vantage/
├── backend/
│   ├── agents/                   # Specialized AI agent implementations
│   │   ├── blueprint.py          # Core architectural generator
│   │   ├── business.py           # Monetization & business models
│   │   ├── devils_advocate.py    # Risk & vulnerability stress testing
│   │   ├── feasibility.py        # Technical debt & MVP feasibility scoring
│   │   ├── github_scraper.py     # GitHub open-source benchmarking
│   │   ├── pitch.py              # Pitch deck & narrative engine
│   │   ├── principal_architect.py# Senior Engineer blueprint generator
│   │   ├── profiler.py           # Hackathon jury profiler
│   │   ├── scraper.py            # DuckDuckGo search integration
│   │   ├── scrum_master.py       # Sprint roadmap & task allocation
│   │   └── ux_visionary.py       # Wireframe & user flow concepts
│   ├── tests/                    # Backend test suite
│   ├── auth.py                   # User authentication, JWT, password hashing
│   ├── db.py                     # PostgreSQL connection & migrations
│   ├── email_service.py          # Password reset email transport
│   ├── graph.py                  # LangGraph compiled state graph
│   ├── main.py                   # FastAPI routing, endpoints & CORS
│   ├── persistence.py            # Run persistence middleware
│   ├── requirements.txt          # Production dependencies
│   ├── state.py                  # Typed graph state definitions
│   ├── user_data.py              # User profiles, saved history, preferences
│   └── utils.py                  # Resilient JSON parsers & fallbacks
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js 16 App Router (pages & layouts)
│   │   ├── components/           # UI components, modals, tabs, diagrams
│   │   │   ├── auth/             # Login, signup, password reset components
│   │   │   ├── playground/       # Architecture Studio, Diagnostics, Web Intel
│   │   │   └── ui/               # Reusable primitives (Toasts, buttons, badges)
│   │   ├── hooks/                # React hooks
│   │   ├── lib/                  # API client & history helpers
│   │   └── utils/                # Mermaid parsers & XML converters
│   ├── tests/                    # Frontend integration tests
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml            # PostgreSQL + pgvector container definition
├── PRODUCT_THESIS.md             # Comprehensive strategic product thesis
├── PROPOSED_AGENTS.md            # Agent specifications & architecture design
└── README.md                     # Project documentation
```

---

## 📄 License
MIT License. Built with ❤️ for the global hacker community.
