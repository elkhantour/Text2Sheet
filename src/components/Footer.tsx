import React, { useState } from "react";
import type { MarkedNode } from "../types/messages";
import { buildCSV, downloadCSV, countExportableRows } from "../utils/csv";

interface FooterProps {
  nodes: MarkedNode[];
}

export function Footer({ nodes }: FooterProps): React.ReactElement {
  const [hovered, setHovered] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const rowCount = countExportableRows(nodes);
  const canDownload = rowCount > 0;

  const handleDownload = () => {
    if (!canDownload || downloading) return;

    setDownloading(true);
    try {
      const csv = buildCSV(nodes);
      const filename = `text2sheet_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCSV(csv, filename);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  return (
    <div
      style={{
        padding: "10px 12px 14px",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleDownload}
        disabled={!canDownload}
        style={{
          width: "100%",
          height: 40,
          borderRadius: "var(--radius-md)",
          border: canDownload
            ? `1px solid ${hovered ? "var(--accent)" : "var(--border-light)"}`
            : "1px solid var(--border)",
          background: canDownload
            ? hovered ? "var(--accent-dim)" : "var(--surface-2)"
            : "var(--surface)",
          color: canDownload
            ? hovered ? "var(--accent)" : "var(--text-secondary)"
            : "var(--text-muted)",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "var(--font)",
          cursor: canDownload ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all var(--transition)",
          letterSpacing: "0.01em",
        }}
      >
        {downloading ? (
          <>
            <Spinner />
            Exporting…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1v8M4 6l3 3 3-3M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {canDownload ? `Download CSV  ·  ${rowCount} rows` : "No text to export"}
          </>
        )}
      </button>
    </div>
  );
}

function Spinner(): React.ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 10" />
    </svg>
  );
}
