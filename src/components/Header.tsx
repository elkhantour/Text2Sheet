import React from "react";

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 12px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "linear-gradient(135deg, var(--accent) 0%, #34d399 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
    fontFamily: "var(--font)",
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    color: "var(--text-muted)",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    fontFamily: "var(--font)",
  },
};

export function Header(): React.ReactElement {
  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <div style={styles.icon}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4h12M2 8h8M2 12h5"
              stroke="#0f0f11"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <rect x="11" y="9" width="4" height="4" rx="1" fill="#0f0f11" opacity="0.7" />
          </svg>
        </div>
        <span style={styles.title}>Text2Sheet</span>
      </div>
      <span style={styles.badge}>v1.0</span>
    </header>
  );
}
