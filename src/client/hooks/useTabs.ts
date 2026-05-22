import { useMemo, useState } from "react";
import type { MarkedNode, NodeSection, FrameTab } from "@ctypes/messages";

/**
 * Derives the ordered list of tabs from nodes + sections.
 * Tab order = first-seen order across itemOrder.
 * A tab is visible if it has ≥1 node OR ≥1 section.
 */
export function useTabs(
  nodes: MarkedNode[],
  sections: NodeSection[],
  itemOrder: string[],
) {
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const sectionMap = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);

  // Derive ordered, deduplicated tabs
  const tabs: FrameTab[] = useMemo(() => {
    const seen = new Map<string, string>(); // topFrameId → topFrameName

    for (const id of itemOrder) {
      const node = nodeMap.get(id);
      if (node && !seen.has(node.topFrameId)) {
        seen.set(node.topFrameId, node.topFrameName);
      }
      const section = sectionMap.get(id);
      if (section) {
        // Get frame name from section's nodes, or fall back to a node lookup
        if (!seen.has(section.topFrameId)) {
          const firstName = section.nodeIds
            .map((nid) => nodeMap.get(nid))
            .find((n) => n)?.topFrameName ?? section.topFrameId;
          seen.set(section.topFrameId, firstName);
        }
      }
    }

    return Array.from(seen.entries()).map(([topFrameId, topFrameName]) => ({ topFrameId, topFrameName }));
  }, [nodes, sections, itemOrder, nodeMap, sectionMap]);

  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Auto-select first tab, or reset if active tab disappears
  const resolvedActiveTabId = useMemo(() => {
    if (tabs.length === 0) return null;
    if (activeTabId && tabs.some((t) => t.topFrameId === activeTabId)) return activeTabId;
    return tabs[0].topFrameId;
  }, [tabs, activeTabId]);

  // Nodes and sections filtered to the active tab
  const activeNodes = useMemo(
    () => nodes.filter((n) => n.topFrameId === resolvedActiveTabId),
    [nodes, resolvedActiveTabId],
  );

  const activeSections = useMemo(
    () => sections.filter((s) => s.topFrameId === resolvedActiveTabId),
    [sections, resolvedActiveTabId],
  );

  const activeItemOrder = useMemo(() => {
    const activeNodeIds = new Set(activeNodes.map((n) => n.id));
    const activeSectionIds = new Set(activeSections.map((s) => s.id));
    return itemOrder.filter((id) => activeNodeIds.has(id) || activeSectionIds.has(id));
  }, [itemOrder, activeNodes, activeSections]);

  return {
    tabs,
    activeTabId: resolvedActiveTabId,
    setActiveTabId,
    activeNodes,
    activeSections,
    activeItemOrder,
  };
}
