/**
 * Converts Mermaid flowchart/graph syntax into draw.io mxGraphModel XML
 */

interface ParsedNode {
  id: string;
  label: string;
  group: string;
}

interface ParsedEdge {
  source: string;
  target: string;
  label?: string;
  style?: string;
}

const PALETTE = [
  { fill: "#181824", stroke: "#EC4899", font: "#FFFFFF" }, // Pink
  { fill: "#181824", stroke: "#A855F7", font: "#FFFFFF" }, // Purple
  { fill: "#181824", stroke: "#3B82F6", font: "#FFFFFF" }, // Blue
  { fill: "#181824", stroke: "#10B981", font: "#FFFFFF" }, // Emerald
  { fill: "#181824", stroke: "#F59E0B", font: "#FFFFFF" }, // Amber
  { fill: "#181824", stroke: "#06B6D4", font: "#FFFFFF" }, // Cyan
];

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function extractMermaidCode(markdownText: string): string {
  if (!markdownText) return "";
  
  // Try finding ```mermaid ... ```
  const codeBlockMatch = markdownText.match(/```(?:mermaid)?\s*([\s\S]*?(?:graph|flowchart)[\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }

  // Try finding standalone graph or flowchart statement
  const directMatch = markdownText.match(/((?:graph|flowchart)\s+[TBRLE][A-Z]?[\s\S]*)/i);
  if (directMatch && directMatch[1]) {
    return directMatch[1].trim();
  }

  return "";
}

export function mermaidToDrawioXml(mermaidCode: string): string {
  if (!mermaidCode || !mermaidCode.trim()) {
    // Return a sleek empty starter template
    return `<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1200" pageHeight="800" background="#0F172A"><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>`;
  }

  const nodes = new Map<string, ParsedNode>();
  const edges: ParsedEdge[] = [];
  const groups: string[] = [];
  let currentGroup = "Main Architecture";

  const lines = mermaidCode.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("%%") || line.startsWith("graph") || line.startsWith("flowchart")) {
      continue;
    }

    // Check for subgraph definition
    const subMatch = line.match(/^subgraph\s+(?:\[?"?)(.*?)(?:\]?"?)$/i);
    if (subMatch) {
      const gName = subMatch[1].replace(/["\[\]]/g, "").trim();
      currentGroup = gName || "Subsystem";
      if (!groups.includes(currentGroup)) {
        groups.push(currentGroup);
      }
      continue;
    }

    if (line.match(/^end$/i)) {
      currentGroup = "Main Architecture";
      continue;
    }

    // Parse nodes defined on this line: e.g. A[Label] or A("Label") or A{"Label"}
    const nodeRegex = /([a-zA-Z0-9_-]+)\s*(?:\[|\(|\{)(?:["']?)(.*?)(?:["']?)(?:\]|\)|\})/g;
    let nMatch: RegExpExecArray | null;
    while ((nMatch = nodeRegex.exec(line)) !== null) {
      const id = nMatch[1].trim();
      const label = nMatch[2].trim() || id;
      if (!nodes.has(id)) {
        nodes.set(id, { id, label, group: currentGroup });
      }
    }

    // Parse edges: e.g. A --> B or A -->|Label| B or A -- "Label" --> B or A -.-> B
    const edgeRegex = /([a-zA-Z0-9_-]+)(?:\s*\[[^\]]*\]|\s*\([^\)]*\))?\s*(?:-->|-.->|==>|--\s*(?:["']?)(.*?)(?:["']?)\s*-->|-->\|(.*?)\|)\s*([a-zA-Z0-9_-]+)/g;
    let eMatch: RegExpExecArray | null;
    while ((eMatch = edgeRegex.exec(line)) !== null) {
      const src = eMatch[1].trim();
      const edgeLabel = (eMatch[2] || eMatch[3] || "").trim();
      const tgt = eMatch[4].trim();

      // Ensure nodes exist even if defined inline in edge
      if (!nodes.has(src)) {
        nodes.set(src, { id: src, label: src, group: currentGroup });
      }
      if (!nodes.has(tgt)) {
        nodes.set(tgt, { id: tgt, label: tgt, group: currentGroup });
      }

      edges.push({
        source: src,
        target: tgt,
        label: edgeLabel,
      });
    }
  }

  // Layout calculations
  const nodeList = Array.from(nodes.values());
  const distinctGroups = groups.length > 0 ? groups : ["Main Architecture"];
  const groupNodeMap = new Map<string, ParsedNode[]>();

  distinctGroups.forEach((g) => groupNodeMap.set(g, []));
  if (!groupNodeMap.has("Main Architecture")) {
    groupNodeMap.set("Main Architecture", []);
  }

  nodeList.forEach((node) => {
    const list = groupNodeMap.get(node.group) || groupNodeMap.get("Main Architecture")!;
    list.push(node);
  });

  // Calculate coordinates
  let xmlCells = "";
  let groupIndex = 0;
  const cardWidth = 190;
  const cardHeight = 60;
  const colWidth = 270;
  const rowHeight = 100;
  let maxColHeight = 600;

  groupNodeMap.forEach((gNodes, groupName) => {
    if (gNodes.length === 0) return;

    const groupX = 60 + groupIndex * colWidth;
    const groupY = 60;
    const gHeight = Math.max(300, gNodes.length * rowHeight + 80);
    if (gHeight > maxColHeight) maxColHeight = gHeight;

    const palette = PALETTE[groupIndex % PALETTE.length];

    // Swimlane / Group box
    if (distinctGroups.length > 1 || groupName !== "Main Architecture") {
      xmlCells += `
    <mxCell id="grp_${groupIndex}" value="${escapeXml(groupName)}" style="swimlane;startSize=28;rounded=1;arcSize=8;whiteSpace=wrap;html=1;fillColor=#0F131D;strokeColor=${palette.stroke};strokeWidth=1.5;fontColor=${palette.stroke};fontSize=12;fontStyle=1;collapsible=0;" vertex="1" parent="1">
      <mxGeometry x="${groupX - 20}" y="${groupY - 10}" width="${colWidth - 30}" height="${gHeight}" as="geometry"/>
    </mxCell>`;
    }

    gNodes.forEach((node, nodeIdx) => {
      const nodeX = groupX;
      const nodeY = groupY + 40 + nodeIdx * rowHeight;

      xmlCells += `
    <mxCell id="node_${escapeXml(node.id)}" value="${escapeXml(node.label)}" style="rounded=1;arcSize=12;whiteSpace=wrap;html=1;fillColor=${palette.fill};strokeColor=${palette.stroke};strokeWidth=1.5;fontColor=${palette.font};fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
      <mxGeometry x="${nodeX}" y="${nodeY}" width="${cardWidth}" height="${cardHeight}" as="geometry"/>
    </mxCell>`;
    });

    groupIndex++;
  });

  // Add edges
  edges.forEach((edge, idx) => {
    const edgeVal = edge.label ? escapeXml(edge.label) : "";
    xmlCells += `
    <mxCell id="edge_${idx}" value="${edgeVal}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#C026D3;strokeWidth=1.8;fontColor=#F472B6;fontSize=10;labelBackgroundColor=#0B0B10;entryX=0;entryY=0.5;exitX=1;exitY=0.5;" edge="1" parent="1" source="node_${escapeXml(edge.source)}" target="node_${escapeXml(edge.target)}">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>`;
  });

  const pageWidth = Math.max(1200, groupIndex * colWidth + 120);
  const pageHeight = Math.max(900, maxColHeight + 160);

  return `<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageWidth}" pageHeight="${pageHeight}" background="#0B0B10">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    ${xmlCells}
  </root>
</mxGraphModel>`;
}
