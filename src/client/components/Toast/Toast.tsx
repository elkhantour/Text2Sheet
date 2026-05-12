import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  kind: "error" | "success" | "info";
  onDismiss: () => void;
}

export function Toast({ message, kind, onDismiss }: ToastProps): React.ReactElement {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const colors = {
    error: { bg: "var(--danger-dim)", border: "var(--danger)", text: "var(--danger)" },
    success: { bg: "var(--accent-dim)", border: "var(--accent)", text: "var(--accent)" },
    info: { bg: "var(--surface-2)", border: "var(--border-light)", text: "var(--text-secondary)" },
  };

  const c = colors[kind];

  const icon = {
    error: "✕",
    success: "✓",
    info: "i",
  }[kind];

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "absolute",
       bottom: 120,
        left: 12,
        right: 12,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "var(--radius-md)",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        zIndex: 100,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `1.5px solid ${c.border}`,
          color: c.text,
          fontSize: 10,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ color: c.text, fontSize: 12, lineHeight: 1.4 }}>{message}</span>
    </div>
  );
}
