import React from "react";
import { usePlugin } from "./hooks/usePlugin";
import { Header } from "./components/Header";
import { Toolbar } from "./components/Toolbar";
import { NodeList } from "./components/NodeList";
import { Footer } from "./components/Footer";
import { Toast } from "./components/Toast";

export function App(): React.ReactElement {
  const {
    markedNodes,
    isLoading,
    toast,
    markSelection,
    unmarkNode,
    selectNode,
    reorderNodes,
    dismissToast,
  } = usePlugin();

  const handleClearAll = () => {
    // Unmark each one — simple approach, triggers one storage update per node.
    // For a cleaner UX, a dedicated CLEAR_ALL message could be added.
    for (const node of markedNodes) {
      unmarkNode(node.id);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "relative",
        background: "var(--bg)",
      }}
    >
      <Header />

      <Toolbar
        nodes={markedNodes}
        onMarkSelection={markSelection}
        onClearAll={handleClearAll}
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <NodeList
          nodes={markedNodes}
          onUnmark={unmarkNode}
          onSelect={selectNode}
          onReorder={reorderNodes}
        />
      )}

      <Footer nodes={markedNodes} />

      {toast && (
        <Toast
          message={toast.message}
          kind={toast.kind}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}

function LoadingState(): React.ReactElement {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: 12,
        fontFamily: "var(--font)",
        gap: 8,
      }}
    >
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
      Loading…
    </div>
  );
}
