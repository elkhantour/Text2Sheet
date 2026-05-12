import React, { useState } from "react";
import type { MarkedNode } from "@ctypes/messages";
import { NodeCard } from "../NodeCard/NodeCard";

interface NodeListProps {
  nodes: MarkedNode[];
  onUnmark: (id: string) => void;
  onSelect: (id: string) => void;
  onReorder: (nodeIds: string[]) => void;
}

export function NodeList({ nodes, onUnmark, onSelect, onReorder }: NodeListProps): React.ReactElement {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  const orderedNodes = localOrder
    ? localOrder.map((id) => nodes.find((n) => n.id === id)).filter(Boolean) as MarkedNode[]
    : nodes;

  const handleDragStart = (_e: React.DragEvent, id: string) => {
    setDraggingId(id);
    setLocalOrder(orderedNodes.map((n) => n.id));
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    setLocalOrder((prev) => {
      const order = prev ?? orderedNodes.map((n) => n.id);
      const fromIdx = order.indexOf(draggingId);
      const toIdx = order.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return order;
      const next = [...order];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggingId);
      return next;
    });
  };

  const handleDragEnd = () => {
    if (localOrder) {
      onReorder(localOrder);
    }
    setDraggingId(null);
    setLocalOrder(null);
  };

  if (nodes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {orderedNodes.map((node, index) => (
        <NodeCard
          key={node.id}
          node={node}
          index={index}
          onUnmark={onUnmark}
          onSelect={onSelect}
          isDragging={draggingId === node.id}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 12,
        color: "var(--text-muted)",
        textAlign: "center",
      }}
    >
      {/* Grid icon */}
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="4" width="14" height="14" rx="3" stroke="var(--border-light)" strokeWidth="1.5" />
        <rect x="22" y="4" width="14" height="14" rx="3" stroke="var(--border-light)" strokeWidth="1.5" />
        <rect x="4" y="22" width="14" height="14" rx="3" stroke="var(--border-light)" strokeWidth="1.5" />
        <rect x="22" y="22" width="14" height="14" rx="3" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 2" />
        <path d="M27 29h4M29 27v4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
          No layers marked
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.5 }}>
          Select layers in the canvas,<br />then click <strong style={{ color: "var(--text-secondary)" }}>Mark Selection</strong>
        </p>
      </div>
    </div>
  );
}
