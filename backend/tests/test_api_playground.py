import asyncio
from main import playground_generate, PlaygroundRequest

async def run_test():
    req = PlaygroundRequest(
        organizer_name="Hack with Hyderabad 3.0",
        problem_statement="Build an AI-powered offline-first emergency response and volunteer routing system for flash floods and urban disaster management.",
        model="gemini-3.5-flash-lite",
        temperature=0.4
    )
    print("Executing playground_generate test...")
    res = await playground_generate(req)
    print("Execution completed successfully!")
    print("Status:", res["status"])
    print("Precedent web sources:", len(res.get("precedent_intelligence", {}).get("web_sources", [])))
    print("Feasibility Why THIS count:", len(res.get("feasibility_analysis", {}).get("why_this_feature", [])))
    print("Feasibility Why NOT THAT count:", len(res.get("feasibility_analysis", {}).get("why_not_that_feature", [])))
    print("Tech Tradeoffs count:", len(res.get("feasibility_analysis", {}).get("tech_tradeoffs", [])))
    print("Jury Defense Q&A count:", len(res.get("final_blueprint", {}).get("jury_defense_qa", [])))
    print("Trace steps:", [s["name"] for s in res.get("trace", [])])

if __name__ == "__main__":
    asyncio.run(run_test())
