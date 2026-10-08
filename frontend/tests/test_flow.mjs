import fs from 'fs';

function sanitizeMermaid(raw) {
  if (!raw) return "";
  let clean = raw.trim();

  // Ensure it has a diagram definition prefix
  if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie)/i.test(clean)) {
    clean = "graph TD\n" + clean;
  }

  // Auto-quote unquoted labels containing parentheses inside square brackets: A[Text (detail)] -> A["Text (detail)"]
  clean = clean.replace(/\[([^"\]\n]*\([^"\]\n]*\)[^"\]\n]*)\]/g, '["$1"]');

  return clean;
}

async function test() {
  const res = await fetch("http://localhost:8000/api/playground/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizer_name: "Smart India Hackathon (SIH)",
      problem_statement: "Problem Statement ID 26025: Development of an AI-enabled Low Cost Real Time Mine Subsidence Monitoring, Prediction and Early Warning System for Underground Coal Mines in India.",
      model: "gemini-3.5-flash-lite",
      temperature: 0.7
    })
  });
  const data = await res.json();
  const arch = data.final_blueprint?.architecture || "";
  
  const codeBlockMatch = arch.match(/```(?:mermaid)?\s*([\s\S]*?(?:graph|flowchart)[\s\S]*?)```/i);
  let chart = "";
  if (codeBlockMatch) {
    chart = codeBlockMatch[1].trim();
  }
  const cleanChart = sanitizeMermaid(chart);
  fs.writeFileSync('C:/scratch/extracted_chart.txt', cleanChart, 'utf8');
  console.log("Saved cleanChart, length:", cleanChart.length);
}
test();
