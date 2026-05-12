import { useEffect, useCallback, useState } from "react";
import type { MarkedNode, UIToPluginMessage, PluginToUIMessage } from "../types/messages";

export interface PluginHookReturn {
  markedNodes: MarkedNode[];
  isLoading: boolean;
  toast: { message: string; kind: "error" | "success" | "info" } | null;
  markSelection: () => void;
  unmarkNode: (nodeId: string) => void;
  selectNode: (nodeId: string) => void;
  reorderNodes: (nodeIds: string[]) => void;
  dismissToast: () => void;
}

export function usePlugin(): PluginHookReturn {
  const [markedNodes, setMarkedNodes] = useState<MarkedNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<PluginHookReturn["toast"]>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Listen to plugin messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as PluginToUIMessage;
      if (!msg) return;

      switch (msg.type) {
        case "MARKED_NODES_UPDATE":
          setMarkedNodes(msg.nodes);
          setIsLoading(false);
          break;
        case "ERROR":
          setToast({ message: msg.message, kind: "error" });
          break;
        case "NOTIFY":
          setToast({ message: msg.message, kind: "success" });
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Load on mount
  useEffect(() => {
    postMessage({ type: "LOAD_MARKED" });
  }, []);

  const markSelection = useCallback(() => {
    postMessage({ type: "MARK_SELECTION" });
  }, []);

  const unmarkNode = useCallback((nodeId: string) => {
    postMessage({ type: "UNMARK_NODE", nodeId });
  }, []);

  const selectNode = useCallback((nodeId: string) => {
    postMessage({ type: "SELECT_NODE", nodeId });
  }, []);

  const reorderNodes = useCallback((nodeIds: string[]) => {
    postMessage({ type: "REORDER_NODES", nodeIds });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return {
    markedNodes,
    isLoading,
    toast,
    markSelection,
    unmarkNode,
    selectNode,
    reorderNodes,
    dismissToast,
  };
}

function postMessage(msg: UIToPluginMessage): void {
  parent.postMessage({ pluginMessage: msg }, "*");
}
