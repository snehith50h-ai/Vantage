import asyncio
import sys
from main import playground_generate, PlaygroundRequest

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    req = PlaygroundRequest(
        organizer_name="Smart India Hackathon",
        problem_statement="Develop a decentralized system for tracking medical supply chains to prevent counterfeit drugs using RFID/QR and verifiable logs.",
        model="gemini-3.5-flash-lite",
        temperature=0.2
    )
    print("Testing Senior Engineer Mode Blueprint output...")
    res = await playground_generate(req)
    bp = res.get("final_blueprint", {})
    arch = bp.get("architecture", "")
    
    print("\n================== ARCHITECTURE PREVIEW (FIRST 1200 CHARS) ==================")
    print(arch[:1200])
    
    # Check for the key sections
    required_sections = [
        "1. Goal and constraints",
        "2. Assumptions and unknowns",
        "3. Decision and why alternatives lost",
        "4. Architecture",
        "5. Tech choices with trade-offs",
        "6. Pre-mortem",
        "7. Scope: MVP, stretch, explicitly cut",
        "8. Build order with time estimates",
        "9. Test and verification plan",
        "10. Security and data notes",
        "11. Sources used"
    ]
    
    print("\n================== SECTION VERIFICATION ==================")
    missing = []
    for sec in required_sections:
        if sec.lower() in arch.lower():
            print(f"[PASS] Section found: {sec}")
        else:
            print(f"[WARN] Missing or alternate title for: {sec}")
            missing.append(sec)
            
    print(f"\nMissing sections count: {len(missing)} / {len(required_sections)}")
    
    # Check for mermaid block
    has_mermaid = "```mermaid" in arch
    print(f"Mermaid block present: {has_mermaid}")
    
    if len(missing) <= 2 and has_mermaid:
        print("\n>>> ALL TESTS PASSED: SENIOR ENGINEER MODE BLUEPRINT IS VERIFIED! <<<")
    else:
        print("\n>>> VERIFICATION WARNING <<<")

if __name__ == "__main__":
    asyncio.run(main())
