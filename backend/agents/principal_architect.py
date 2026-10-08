"""Principal Architect / Senior Engineer Mode Agent.

Implements the Senior Engineer Mode engineering protocol:
15+ years experience, correctness, simplicity, evidence over impressiveness.
Generates an 11-section architectural blueprint and pre-mortem specification
with an integrated Mermaid system flowchart.
"""

import os
import re
import json
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from state import HackathonState

load_dotenv()

SENIOR_ENGINEER_PROMPT_TEMPLATE = """# IDENTITY
You are a principal software engineer with 15+ years shipping production systems under deadlines. You have seen projects fail from over-scoping, untested integrations, and unexamined assumptions. You value correctness, simplicity, and evidence over impressiveness.

# PRIME DIRECTIVES
1. Solve the actual problem, not the most impressive-sounding one.
2. Prefer the simplest design that meets the requirements and constraints. Add complexity only when you can name the requirement that forces it.
3. Never state a fact you cannot support. Separate clearly: FACT (from input or sources, cited), ASSUMPTION (stated explicitly), and INFERENCE (reasoned, labeled). If unknown, say "Unknown" and say how to find out.
4. Every recommendation must survive the question "what would make this fail?"

# ENGINEERING PROTOCOL (follow in order, silently, before writing the answer)
1. REQUIREMENTS: Restate the goal in one sentence. List functional requirements, non-functional requirements (latency, cost, reliability, security, privacy), and hard constraints (deadline, team, budget, mandated tech). Flag anything ambiguous. If a missing answer would change the design, ask one short question; otherwise state the assumption and proceed.
2. SUCCESS CRITERIA: Identify exactly how the result will be judged or measured. Rank the criteria by weight. Design to the criteria, not around them.
3. OPTIONS: Generate at least three genuinely different approaches, including a "boring but reliable" one. For each: how it works, effort, main risk.
4. DECISION: Choose one using explicit trade-offs (effort vs. impact, risk vs. novelty, fit to constraints). Record why the rejected options lost.
5. DESIGN: Define components, data flow, interfaces, and data model at the level needed to start building. Name the exact technology for each piece and why it was chosen over its realistic alternative. Do not invent versions, endpoints, model IDs, or benchmarks; if you are not certain, write "verify in official docs".
6. FAILURE ANALYSIS (pre-mortem): Assume the project failed. List the top 5 likely causes (integration breaks, rate limits, bad data, scope overrun, demo-time failure, security hole). For each give a concrete mitigation and a fallback.
7. SCOPE CUT: List what is explicitly out of scope and why. Define the minimum viable version that is demonstrably complete, then ordered stretch goals.
8. BUILD ORDER: Sequence the work so there is a working end-to-end slice as early as possible (walking skeleton first), then add features by value. Estimate effort per item against the stated time and flag if the total exceeds capacity; if it does, cut, don't compress.
9. VERIFICATION: Define how each requirement will be tested (unit, integration, end-to-end, manual demo script), and what measurable evidence will prove it works (latency, accuracy, cost, pass rate). Include observability: what is logged and how failures are detected.
10. SECURITY AND DATA: Identify sensitive data, secrets handling, auth needs, and abuse cases. Keep only what the requirements demand.

# QUALITY BAR (check before answering)
- Is every named technology necessary? Remove anything that does not serve a stated requirement.
- Do counts, names, and numbers agree across all sections?
- Are there placeholders, "TBD", "N/A", or generic filler? Replace with a concrete value or an explicit assumption.
- Would a competent engineer be able to start building from this today without asking questions?
- Is the plan achievable by the stated team in the stated time? 
- Have you claimed anything about performance, cost, or superiority without evidence? Remove it or label it as a hypothesis to measure.

# EVIDENCE RULES
- Use only the provided SOURCES and the user's input for external facts. Cite as [S#].
- General engineering knowledge is allowed, but label version-specific or vendor-specific details as "verify in official docs".
- Never invent past results, winners, statistics, or quotes.

# COMMUNICATION
- Lead with the decision, then the reasoning. Be direct; state disagreement with the user's idea if you have grounds, and say what you would do instead.
- Use short sentences and concrete nouns. No hype words ("revolutionary", "seamless", "enterprise-grade") unless backed by a specific property.
- Show trade-offs honestly, including the downsides of your chosen design.

# OUTPUT FORMAT (Strictly format as GitHub-flavored Markdown with these 11 exact numbered sections)
## 1. Goal and constraints (3 to 6 lines)
## 2. Assumptions and unknowns
## 3. Decision and why alternatives lost
(Include 3 to 5 sentences on chosen approach, then markdown table: | Option | Pros | Cons | Verdict |)
## 4. Architecture
(Detail components, data flow, and interfaces. You MUST include a valid, complete Mermaid flowchart enclosed in ```mermaid ... ``` using graph TD or flowchart TD with clear subgraphs and protocol annotations.)
## 5. Tech choices with trade-offs
(Markdown table: | Layer | Choice | Alternative | Reason |)
## 6. Pre-mortem (Failure Analysis)
(Markdown table: | Failure Mode | Likelihood | Mitigation | Fallback |)
## 7. Scope: MVP, stretch, explicitly cut
## 8. Build order with time estimates
## 9. Test and verification plan with success metrics
## 10. Security and data notes
## 11. Sources used

# INPUTS
USER REQUEST: {user_input}
CONSTRAINTS: {constraints}
SUCCESS CRITERIA / RUBRIC: {rubric}
SOURCES: {sources}
"""

def extract_text_content(content) -> str:
    """Helper to unwrap LLM response content across langchain / google-genai versions."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and "text" in item:
                parts.append(item["text"])
            else:
                parts.append(str(item))
        return "".join(parts)
    if hasattr(content, "text"):
        return str(content.text)
    return str(content)

def extract_mermaid_code(markdown_text: str) -> str:
    """Extracts raw mermaid diagram code from markdown block."""
    if not markdown_text:
        return ""
    match = re.search(r"```(?:mermaid)?\s*([\s\S]*?(?:graph|flowchart)[\s\S]*?)```", markdown_text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return ""

def get_architect_llm(model_name: Optional[str] = None, temperature: float = 0.2):
    """Factory for low-temperature LLM adhering to senior engineering consistency."""
    api_key = os.getenv("GEMINI_API_KEY")
    candidates = [m for m in [model_name, "gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite"] if m]
    
    for candidate in candidates:
        try:
            return ChatGoogleGenerativeAI(
                model=candidate,
                google_api_key=api_key,
                temperature=temperature
            )
        except Exception:
            continue
            
    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash-lite",
        google_api_key=api_key,
        temperature=temperature
    )

def generate_fallback_blueprint(problem: str, organizer: str, jury_profile: str, constraints: str) -> Dict[str, str]:
    """Provides a deterministic, rigorous fallback adhering strictly to all 11 sections."""
    org = organizer or "Hackathon"
    prob = problem or "Real-World Engineering Challenge"
    
    fallback_mermaid = """graph TD
  subgraph EdgeLayer ["1. Edge & Client Ingestion"]
    CLIENT[Web Dashboard / PWA Client] -->|HTTPS / WSS| INGRESS[NGINX / Envoy Ingress]
    FIELD[Field Sensor / Edge Agent] -->|MQTT / TLS| BROKER[EMQX / Mosquitto Broker]
  end

  subgraph GatewayLayer ["2. API & Security Gateway"]
    INGRESS -->|JWT / Rate Limit| AUTH[Token Verifier & Limiter]
    INGRESS -->|Reverse Proxy| ROUTER[FastAPI Gateway Service]
    BROKER -->|Bridge Webhook| ROUTER
  end

  subgraph CoreLayer ["3. Core Application Mesh"]
    ROUTER -->|gRPC / Async Call| CORE[Domain Logic & Processing Engine]
    ROUTER -->|Pub/Sub Trigger| ANOMALY[Anomaly & Early Warning Worker]
  end

  subgraph AsyncLayer ["4. Event Streaming & Queue"]
    CORE -->|Produce Message| QUEUE[Redis Stream / RabbitMQ]
    QUEUE -->|Consume Worker| ANOMALY
  end

  subgraph PersistenceLayer ["5. Persistence & Cache"]
    CORE -->|Read/Write| DB[(PostgreSQL 16 Relational Store)]
    CORE -->|Cache Hot Data| CACHE[(Redis 7.2 In-Memory Cache)]
    ANOMALY -->|Time-Series Points| TS[(TimescaleDB Hyper-table)]
  end"""

    markdown = f"""## 1. Goal and constraints
* **Primary Objective**: Deliver a production-grade, fault-tolerant implementation solving: {prob[:180]}.
* **Sprint Window**: 24 to 36 hours for team of 3 to 4 developers.
* **Budget**: $0 for proprietary external APIs; rely strictly on open-source packages and generous free tiers.
* **Mandated Reliability**: Must survive offline drops and complete a flawless end-to-end live demo in front of {org} judges.

## 2. Assumptions and unknowns
* **FACT [S1]**: Judging criteria heavily penalizes broken live demos and ungrounded tech buzzwords.
* **ASSUMPTION**: Network connectivity in the presentation hall may be congested or unstable. The client must support offline caching.
* **ASSUMPTION**: Hardware or external devices will be simulated via reproducible seed telemetry scripts to guarantee zero hardware failure risks.
* **UNKNOWN**: Exact jury device screen resolutions and network firewall restrictions. Mitigation: Self-host local docker-compose environment as demo backup.

## 3. Decision and why alternatives lost
We selected a decoupled modular monolith architecture with FastAPI, PostgreSQL, and Redis event streams. This guarantees maximum development velocity within a 24-hour window while maintaining clean separation of concerns for parallel development. Microservice sprawl would lead to integration paralysis, while pure serverless risks cold starts and vendor auth locks.

| Option | Pros | Cons | Verdict |
| :--- | :--- | :--- | :--- |
| **Modular Async Monolith (FastAPI + Redis + Postgres)** | Rapid single-repo development, zero network IPC overhead, zero cold starts, easily run locally in Docker | Requires disciplined folder boundaries | **CHOSEN**: Highest delivery probability in 24 hours |
| **Distributed Microservices Mesh** | Independent scaling, polyglot freedom | Severe integration risk, network partition debugging, setup takes >10 hours | **REJECTED**: High risk of incomplete demo |
| **Serverless Lambda / Edge Functions** | No server maintenance | Cold start latency, difficult local mocking, WebSocket connection limits | **REJECTED**: Unpredictable latency before live jury |

## 4. Architecture
The architecture separates client ingress, authenticated API routing, async background evaluation, and dual-layer persistence.

```mermaid
{fallback_mermaid}
```

* **Client / Edge**: React/Next.js SPA communicating via REST and secure WebSockets.
* **Ingress & Gateway**: Traefik/NGINX proxy handling rate-limiting and passing requests to FastAPI workers.
* **Core & Processing**: Async Python worker pool executing domain logic and triggering alert thresholds.
* **Storage**: PostgreSQL with TimescaleDB extension for telemetry time-series and Redis for sub-millisecond caching.

## 5. Tech choices with trade-offs
| Layer | Choice | Alternative | Reason |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router) + Tailwind CSS | Vite SPA | Server components reduce bundle size and provide fast first-paint for judges. |
| **Backend API** | FastAPI (Python 3.12) | Express.js / Node | Native async I/O, auto-generated OpenAPI docs, direct integration with Python ML/scientific libraries. |
| **Message Broker** | Redis Streams | Apache Kafka | Redis runs in <30MB RAM with zero Zookeeper/Kraft overhead, setting up in 2 minutes vs 2 hours for Kafka. |
| **Primary Database** | PostgreSQL 16 | MongoDB | Strict relational schema prevents corrupt states during fast feature additions; pgvector enables embeddings. |
| **Time-Series / Telemetry** | TimescaleDB Extension | InfluxDB | Runs natively inside existing Postgres instance, eliminating second database management overhead. |

## 6. Pre-mortem (Failure Analysis)
| Failure Mode | Likelihood | Mitigation | Fallback |
| :--- | :--- | :--- | :--- |
| **1. Conference WiFi drops during demo** | High | Service Worker client caching and local IndexedDB spooling | Pre-recorded 1080p 60fps walkthrough video and local Docker container |
| **2. 3rd-party API rate-limiting or downtime** | Medium | Cache external API responses locally into Redis mock fixtures | Synthetic data generator toggle switch in frontend UI |
| **3. Schema drift between frontend & backend** | High | Auto-generate TypeScript interfaces directly from FastAPI Pydantic schema | Strict single contract file shared in monorepo |
| **4. Team runs out of time on edge cases** | High | Ruthless scope cut; lock MVP features by hour 14 | Hard freeze on UI design after hour 18 |
| **5. Database connection pool exhaustion** | Medium | SQLAlchemy async pool limits + PgBouncer | Fixed connection pool size of 10 with short timeout (3s) |

## 7. Scope: MVP, stretch, explicitly cut
* **MVP (Must Deliver by Hour 16)**:
  - Core ingestion pipeline accepting simulated or live data.
  - Real-time dashboard displaying status, metrics, and instant threshold alerts.
  - End-to-end user workflow: Input -> Process -> Alert -> Resolution.
* **Stretch Goals (Hours 16 - 20)**:
  - Historical playback slider for past events.
  - Automated PDF executive summary generation for judges.
* **Explicitly Cut (Out of Scope)**:
  - Custom OAuth registration (use demo credentials).
  - Multi-tenant enterprise organization billing.
  - Native iOS/Android apps (use mobile responsive web).

## 8. Build order with time estimates
* **Hours 0 - 3 (Walking Skeleton)**: Repo setup, Docker Compose (Postgres + Redis), FastAPI health endpoint, basic Next.js layout.
* **Hours 3 - 8 (Core Pipeline)**: Data models, ingestion endpoint, synthetic mock telemetry script.
* **Hours 8 - 14 (UI & Real-time Integration)**: WebSocket / SSE live feed, state management, alert UI.
* **Hours 14 - 18 (End-to-End Verification)**: Integration testing, boundary condition fixes, failure mode verification.
* **Hours 18 - 22 (Polish & Pitch Asset Prep)**: Demo script walkthrough, fallback recording, presentation deck alignment.
* **Hours 22 - 24 (Code Freeze & Rehearsal)**: Zero feature changes; practice 3-minute pitch 5 times.

## 9. Test and verification plan with success metrics
* **Unit Verification**: Pytest suite for critical calculation and alert evaluation logic (>80% coverage on core).
* **Integration Verification**: Automated script firing 100 mock events through API and verifying DB persistence.
* **Demo Verification Script**: 180-second rehearsal checklist executed twice from clean database state.
* **Success Metrics**: End-to-end alert trigger latency < 250ms; 0 unhandled 500 errors during a 5-minute continuous run.
* **Observability**: Structured JSON logging with request IDs and a health status widget visible on the UI footer.

## 10. Security and data notes
* **Secrets Handling**: Zero credentials checked into Git. Use `.env.example` with standard environment variables.
* **Authentication**: Session tokens with Bearer authorization header; bypass toggle for local offline demo.
* **Input Sanitization**: Pydantic input models strictly validate payloads before processing.
* **Data Minimization**: Store only necessary telemetry points; purge transient scratch files automatically.

## 11. Sources used
* [S1] Hackathon Problem Statement & Organizer Brief for {org}.
* [S2] Judging Profile & Scoring Criteria: {jury_profile[:150]}.
"""

    return {
        "architecture": markdown,
        "mermaid_code": fallback_mermaid
    }

def generate_senior_engineer_blueprint(
    problem: str,
    organizer: str = "National Hackathon",
    jury_profile: str = "",
    constraints: str = "",
    sources: Optional[List[Dict[str, str]]] = None,
    feasibility_data: Optional[Dict[str, Any]] = None,
    model_name: Optional[str] = None,
    temperature: float = 0.2
) -> Dict[str, str]:
    """Runs the 10-step Senior Engineer protocol to produce the 11-section architecture blueprint."""
    
    # Format sources list
    formatted_sources_list = []
    if sources:
        for idx, src in enumerate(sources, start=1):
            title = src.get("title") or src.get("name") or f"Source {idx}"
            url = src.get("url") or "#"
            snippet = src.get("snippet") or src.get("content") or ""
            formatted_sources_list.append(f"[S{idx}] {title} ({url}): {snippet[:180]}")
            
    if not formatted_sources_list:
        formatted_sources_list = [
            f"[S1] Problem Brief: {problem[:200]}",
            f"[S2] Organizer & Rubric Context: {organizer} - {jury_profile[:200]}"
        ]
        
    formatted_sources = "\n".join(formatted_sources_list)
    
    # Format constraints
    default_constraints = (
        "Time: 24 to 36 hour hackathon sprint. "
        "Team: 3 to 4 fullstack developers. "
        "Budget: $0 (strict open-source and free cloud tiers). "
        "Reliability: Must survive network disconnects and execute a live working demo."
    )
    effective_constraints = f"{default_constraints} {constraints}".strip()
    
    # Format rubric context
    effective_rubric = jury_profile.strip() if jury_profile else (
        "Technical execution (30%), Practical feasibility & field resilience (30%), "
        "Innovation & simplicity (20%), Live working demo clarity (20%)."
    )
    
    # Augment inputs with any known feasibility tradeoffs
    if feasibility_data and isinstance(feasibility_data, dict):
        tradeoffs = feasibility_data.get("tech_tradeoffs", [])
        if tradeoffs:
            tradeoff_text = "\nFeasibility & Trade-off Notes:\n" + "\n".join([
                f"- {t.get('layer', '')}: Preferred {t.get('chosen', '')} over {t.get('alternative', '')}. Rationale: {t.get('tradeoff_rationale', '')}"
                for t in tradeoffs if isinstance(t, dict)
            ])
            effective_constraints += tradeoff_text
            
    try:
        llm = get_architect_llm(model_name=model_name, temperature=temperature)
        prompt = PromptTemplate.from_template(SENIOR_ENGINEER_PROMPT_TEMPLATE)
        chain = prompt | llm
        
        response = chain.invoke({
            "user_input": problem,
            "constraints": effective_constraints,
            "rubric": effective_rubric,
            "sources": formatted_sources
        })
        
        raw_text = extract_text_content(response.content if hasattr(response, "content") else response)
        
        # Verify mermaid diagram existence
        mermaid_code = extract_mermaid_code(raw_text)
        
        if not mermaid_code:
            # Inject a clean fallback diagram into Section 4 if the model omitted it
            fallback = generate_fallback_blueprint(problem, organizer, effective_rubric, effective_constraints)
            mermaid_code = fallback["mermaid_code"]
            if "## 4. Architecture" in raw_text:
                raw_text = raw_text.replace(
                    "## 4. Architecture",
                    f"## 4. Architecture\n\n```mermaid\n{mermaid_code}\n```"
                )
            else:
                raw_text += f"\n\n## 4. Architecture\n\n```mermaid\n{mermaid_code}\n```"
                
        return {
            "architecture": raw_text.strip(),
            "mermaid_code": mermaid_code
        }
    except Exception as e:
        print(f"[Principal Architect] LLM generation failed, engaging senior engineer fallback: {e}")
        return generate_fallback_blueprint(problem, organizer, effective_rubric, effective_constraints)

def principal_architect_node(state: HackathonState) -> Dict[str, Any]:
    """LangGraph node execution for the Senior Engineer Mode Principal Architect."""
    print(">>> ENTERING PRINCIPAL ARCHITECT (SENIOR ENGINEER MODE) NODE")
    
    problem = state.get("problem_statement", "")
    organizer = state.get("organizer_name", "Hackathon")
    jury_profile = state.get("jury_profile", "")
    scraped_history = state.get("scraped_history", [])
    precedent_intel = state.get("precedent_intelligence", {})
    feasibility = state.get("feasibility_analysis", {})
    
    sources = []
    if precedent_intel and isinstance(precedent_intel, dict):
        sources.extend(precedent_intel.get("web_sources", []))
    if not sources and scraped_history:
        sources.extend(scraped_history)
        
    result = generate_senior_engineer_blueprint(
        problem=problem,
        organizer=organizer,
        jury_profile=jury_profile,
        constraints=feasibility.get("constraints", "") if isinstance(feasibility, dict) else "",
        sources=sources,
        feasibility_data=feasibility,
        model_name="gemini-3.5-flash-lite",
        temperature=0.2
    )
    
    final_bp = state.get("final_blueprint", {})
    if not final_bp:
        final_bp = {}
        
    final_bp["architecture"] = result["architecture"]
    
    return {
        "final_blueprint": final_bp,
        "architecture_diagrams": result["mermaid_code"]
    }
