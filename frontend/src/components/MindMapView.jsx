import React, { useState } from "react";
import { motion } from "framer-motion";

const BRANCH_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const W = 800, H = 560;
const CX = W / 2, CY = H / 2;
const BRANCH_R = 165;
const LEAF_R = 82;

function wrapText(label, maxChars) {
  const words = String(label || "").split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function NodeLabel({ lines, fontSize, fill, r }) {
  const lineH = fontSize * 1.25;
  const totalH = lines.length * lineH;
  return lines.map((line, i) => (
    <text
      key={i}
      textAnchor="middle"
      x={0}
      y={-totalH / 2 + lineH * i + lineH * 0.75}
      fontSize={fontSize}
      fill={fill}
      fontWeight={600}
      fontFamily="inherit"
    >
      {line}
    </text>
  ));
}

function buildLayout(mindmap) {
  const branches = mindmap.children || [];
  const n = branches.length;
  const nodes = [];
  const links = [];

  // Center
  nodes.push({ id: "root", x: CX, y: CY, label: mindmap.label, type: "root", color: "#1D4ED8" });

  branches.forEach((branch, bi) => {
    const angle = (bi / n) * 2 * Math.PI - Math.PI / 2;
    const bx = CX + BRANCH_R * Math.cos(angle);
    const by = CY + BRANCH_R * Math.sin(angle);
    const color = BRANCH_COLORS[bi % BRANCH_COLORS.length];

    nodes.push({ id: `b${bi}`, x: bx, y: by, label: branch.label, type: "branch", color });
    links.push({ x1: CX, y1: CY, x2: bx, y2: by, color, opacity: 0.35, width: 2.5 });

    const children = branch.children || [];
    const cn = children.length;
    const spread = cn > 1 ? 0.45 : 0;

    children.forEach((child, ci) => {
      const childAngle = angle + (ci - (cn - 1) / 2) * (cn > 1 ? spread / (cn - 1) : 0);
      const cx2 = bx + LEAF_R * Math.cos(childAngle);
      const cy2 = by + LEAF_R * Math.sin(childAngle);

      nodes.push({ id: `b${bi}c${ci}`, x: cx2, y: cy2, label: child.label, type: "leaf", color });
      links.push({ x1: bx, y1: by, x2: cx2, y2: cy2, color, opacity: 0.25, width: 1.5 });
    });
  });

  return { nodes, links };
}

export default function MindMapView({ result }) {
  const mindmap = result?.mindmap;
  const [hovered, setHovered] = useState(null);

  if (!mindmap?.children?.length) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>
        Mind map not available for this content.
      </div>
    );
  }

  const { nodes, links } = buildLayout(mindmap);

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
        Mind Map
      </div>
      <div style={{
        background: "var(--bg-secondary)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", display: "block", maxHeight: 480 }}
          aria-label="Mind map visualization"
        >
          {/* Connection lines */}
          {links.map((l, i) => (
            <motion.line
              key={i}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={l.color}
              strokeWidth={l.width}
              strokeOpacity={l.opacity}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.04 }}
            />
          ))}

          {/* Nodes */}
          {nodes.map((node) => {
            const isRoot = node.type === "root";
            const isBranch = node.type === "branch";
            const isHovered = hovered === node.id;
            const r = isRoot ? 44 : isBranch ? 33 : 24;
            const fontSize = isRoot ? 10 : isBranch ? 9 : 8;
            const lines = wrapText(node.label, isRoot ? 11 : isBranch ? 9 : 8);

            return (
              <motion.g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "default" }}
              >
                {/* Glow ring on hover */}
                {isHovered && (
                  <circle r={r + 6} fill={node.color} fillOpacity={0.12} />
                )}
                {/* Main circle */}
                <circle
                  r={r}
                  fill={isRoot ? node.color : "var(--bg-card)"}
                  stroke={node.color}
                  strokeWidth={isRoot ? 0 : 2}
                  fillOpacity={isRoot ? 1 : 0.08}
                />
                <NodeLabel
                  lines={lines}
                  fontSize={fontSize}
                  fill={isRoot ? "#ffffff" : node.color}
                  r={r}
                />
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {(mindmap.children || []).map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: BRANCH_COLORS[i % BRANCH_COLORS.length], flexShrink: 0 }} />
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}
