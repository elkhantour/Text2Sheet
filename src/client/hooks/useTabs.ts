import { useMemo, useState } from "react";
import type { MarkedNode, NodeSection, FrameTab } from "@ctypes/messages";
import { ORPHAN_TAB_ID } from "../../lib/constants";

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

	const tabs: FrameTab[] = useMemo(() => {
		const seen = new Map<string, string>(); // topFrameId → topFrameName

		// Build a quick lookup: topFrameId → topFrameName from all nodes regardless of order
		// This way an empty section can still resolve its frame name from any node on the same frame
		const frameNameFromNodes = new Map<string, string>();
		for (const node of nodes) {
			if (!frameNameFromNodes.has(node.topFrameId)) {
				frameNameFromNodes.set(node.topFrameId, node.topFrameName);
			}
		}

		for (const id of itemOrder) {
			const node = nodeMap.get(id);
			if (node && !seen.has(node.topFrameId)) {
				seen.set(node.topFrameId, node.topFrameName);
			}

			const section = sectionMap.get(id);
			if (section && !seen.has(section.topFrameId)) {
				// First try nodes inside this section, then any node on the same frame, then skip (don't fall back to raw ID)
				const nameFromSectionNodes = section.nodeIds
					.map((nid) => nodeMap.get(nid))
					.find((n) => n)?.topFrameName;

				const resolved = nameFromSectionNodes
					?? frameNameFromNodes.get(section.topFrameId);

				if (resolved) seen.set(section.topFrameId, resolved);
				// If still unresolved, skip — it'll get picked up once a node on that frame appears
			}
		}

		return Array.from(seen.entries())
			.map(([topFrameId, topFrameName]) => ({ topFrameId, topFrameName }))
			.sort((a, b) => a.topFrameId === ORPHAN_TAB_ID ? 1 : b.topFrameId === ORPHAN_TAB_ID ? -1 : 0);

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
