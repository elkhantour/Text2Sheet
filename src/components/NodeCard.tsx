import React, { useState } from "react";
import type { MarkedNode } from "../types/messages";

interface NodeCardProps {
  node: MarkedNode;
  index: number;
  onUnmark: (id: string) => void;
  onSelect: (id: string) => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

const nodeTypeColors: Record<string, string> = {
  TEXT: "var(--accent)",
  FRAME: "#a78bfa",
  GROUP: "#fb923c",
  COMPONENT: "#f472b6",
  INSTANCE: "#e879f9",
  SECTION: "#60a5fa",
};

const nodeTypeIcons: Record<string, string> = {
  TEXT: "T",
  FRAME: "☐",
  GROUP: "◎",
  COMPONENT: "◈",
  INSTANCE: "◈",
  SECTION: "▤",
};

export function NodeCard({
  node,
  index,
  onUnmark,
  onSelect,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
}: NodeCardProps): React.ReactElement {
  const [hovered, setHovered] = useState(false);

  const typeColor = nodeTypeColors[node.nodeType] ?? "var(--text-muted)";
  const typeIcon = nodeTypeIcons[node.nodeType] ?? "?";
  const isContainer = node.nodeType !== "TEXT";
  const childCount = node.childTextNodes?.length ?? 0;

  const previewText = isContainer
    ? node.childTextNodes?.map((c) => c.content).join(" · ") ?? ""
    : node.previewText;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node.id)}
      onDragOver={(e) => onDragOver(e, node.id)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--surface-2)" : "var(--surface)",
        border: `1px solid ${isDragging ? "var(--accent)" : hovered ? "var(--border-light)" : "var(--border)"}`,
        borderRadius: "var(--radius-md)",
        padding: "10px 12px",
        cursor: "grab",
        transition: "background var(--transition), border-color var(--transition), opacity var(--transition)",
        opacity: isDragging ? 0.4 : 1,
        userSelect: "none",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Drag handle + index */}
        <span style={{ color: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font)", width: 16, textAlign: "center", flexShrink: 0 }}>
          {hovered ? "⠿" : String(index + 1).padStart(2, "0")}
        </span>

        {/* Type badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "var(--font)",
            color: typeColor,
            background: `${typeColor}18`,
            border: `1px solid ${typeColor}40`,
            borderRadius: 4,
            padding: "1px 5px",
            flexShrink: 0,
          }}
        >
          {typeIcon} {node.nodeType}
        </span>

        {/* Layer name */}
        <span
          className="truncate"
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          {node.name}
        </span>

        {/* Actions */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <ActionButton
            title="Focus layer in canvas"
            onClick={() => onSelect(node.id)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1h3.5M1 1v3.5M11 1h-3.5M11 1v3.5M1 11h3.5M1 11v-3.5M11 11h-3.5M11 11v-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </ActionButton>

          <ActionButton
            title="Remove from export"
            onClick={() => onUnmark(node.id)}
            danger
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </ActionButton>
        </div>
      </div>

      {/* Preview row */}
      {previewText && (
        <div
          className="truncate"
          style={{
            marginTop: 6,
            marginLeft: 24,
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "var(--font)",
          }}
        >
          {previewText}
        </div>
      )}

      {/* Child count for containers */}
      {isContainer && (
        <div style={{ marginTop: 6, marginLeft: 24, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{
            fontSize: 10,
            color: childCount > 0 ? "var(--accent)" : "var(--danger)",
            fontFamily: "var(--font)",
          }}>
            {childCount > 0
              ? `↳ ${childCount} text node${childCount !== 1 ? "s" : ""} found`
              : "↳ no text nodes found"}
          </span>
        </div>
      )}
    </div>
  );
}

interface ActionButtonProps {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}

function ActionButton({ title, onClick, danger, children }: ActionButtonProps): React.ReactElement {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 24,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid transparent",
        borderRadius: 6,
        background: hovered
          ? danger ? "var(--danger-dim)" : "var(--surface-3)"
          : "transparent",
        color: hovered
          ? danger ? "var(--danger)" : "var(--text-primary)"
          : "var(--text-muted)",
        cursor: "pointer",
        transition: "all var(--transition)",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
