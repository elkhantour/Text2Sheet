import React, { useState } from "react";
import { countExportableRows } from "../utils/csv";
import type { MarkedNode } from "../types/messages";

interface ToolbarProps {
  nodes: MarkedNode[];
  onMarkSelection: () => void;
  onClearAll: () => void;
}

export function Toolbar({ nodes, onMarkSelection, onClearAll }: ToolbarProps): React.ReactElement {
  const [markHovered, setMarkHovered] = useState(false);
  const [clearHovered, setClearHovered] = useState(false);

  const rowCount = countExportableRows(nodes);

  return (
    <div
      style={{
        padding: "10px 12px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Action row */}
      <div style={{ display: "flex", gap: 6 }}>
        {/* Mark Selection – primary action */}
        <button
          onMouseEnter={() => setMarkHovered(true)}
          onMouseLeave={() => setMarkHovered(false)}
          onClick={onMarkSelection}
          style={{
            flex: 1,
            height: 34,
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: markHovered
              ? "var(--accent-hover)"
              : "var(--accent)",
            color: "#0f0f11",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--font)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "background var(--transition)",
            letterSpacing: "0.01em",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Mark Selection
        </button>

        {/* Clear All */}
        {nodes.length > 0 && (
          <button
            onMouseEnter={() => setClearHovered(true)}
            onMouseLeave={() => setClearHovered(false)}
            onClick={onClearAll}
            title="Clear all marked layers"
            style={{
              width: 34,
              height: 34,
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${clearHovered ? "var(--danger)" : "var(--border)"}`,
              background: clearHovered ? "var(--danger-dim)" : "transparent",
              color: clearHovered ? "var(--danger)" : "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all var(--transition)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 3h9M4.5 3V1.5h3V3M5 5.5v4M7 5.5v4M2 3l.5 7.5h7L10 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Stats row */}
      {nodes.length > 0 && (
        <div style={{ display: "flex", gap: 12 }}>
          <Stat label="Layers" value={nodes.length} />
          <Stat label="Text rows" value={rowCount} accent />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{
        fontSize: 16,
        fontWeight: 700,
        color: accent ? "var(--accent)" : "var(--text-primary)",
        fontFamily: "var(--font)",
        lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}
