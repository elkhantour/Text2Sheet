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

		const frameNameFromNodes = new Map<string, string>();
		for (const node of nodes) {
			if (!frameNameFromNodes.has(node.topFrameId)) {
				frameNameFromNodes.set(node.topFrameId, node.topFrameName);
			}
		}

		return Array.from(frameNameFromNodes.entries())
			.map(([topFrameId, topFrameName]) => ({ topFrameId, topFrameName }))
			.sort((a, b) => {
				if (a.topFrameId === ORPHAN_TAB_ID) return 1;
				if (b.topFrameId === ORPHAN_TAB_ID) return -1;
				return 0;
			});

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
