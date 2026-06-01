import React, { createContext, useContext, useMemo, useState } from "react";
import type { MarkedNode, NodeSection, FrameTab } from "@ctypes/messages";
import { ORPHAN_TAB_ID } from "../../lib/constants";

interface TabsContextValue {
	tabs: FrameTab[];
	activeTabId: string | null;
	setActiveTabId: (id: string) => void;
	activeNodes: MarkedNode[];
	activeSections: NodeSection[];
	activeItemOrder: string[];
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function TabsProvider({
	nodes,
	sections,
	itemOrder,
	children,
}: {
	nodes: MarkedNode[];
	sections: NodeSection[];
	itemOrder: string[];
	children: React.ReactNode;
}) {
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

	const resolvedActiveTabId = useMemo(() => {
		if (tabs.length === 0) return null;
		if (activeTabId && tabs.some((t) => t.topFrameId === activeTabId)) return activeTabId;
		return tabs[0].topFrameId;
	}, [tabs, activeTabId]);

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

	console.log(tabs);
	console.log(activeNodes);
 
	return (
		<TabsContext.Provider value={{
			tabs,
			activeTabId: resolvedActiveTabId,
			setActiveTabId,
			activeNodes,
			activeSections,
			activeItemOrder,
		}}>
			{children}
		</TabsContext.Provider>
	);
}

export function useTabs(): TabsContextValue {
	const ctx = useContext(TabsContext);
	if (!ctx) throw new Error("useTabs must be used within a TabsProvider");
	return ctx;
}
