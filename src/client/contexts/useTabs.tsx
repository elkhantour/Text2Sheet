import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { MarkedNode, NodeSection, FrameTab } from "@ctypes/messages";
import { ORPHAN_TAB_ID } from "../../lib/constants";

interface TabsContextValue {
	tabs: FrameTab[];
	activeTab: FrameTab | null;
	setActiveTab: (id: string) => void;
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

		for (const section of sections) {
			if (!frameNameFromNodes.has(section.topFrameId)) {
				frameNameFromNodes.set(section.topFrameId, section.topFrameName);
			}
		}

		return Array.from(frameNameFromNodes.entries())
			.map(([topFrameId, topFrameName]) => ({ id: topFrameId, name: topFrameName }))
			.sort((a, b) => {
				if (a.id === ORPHAN_TAB_ID) return 1;
				if (b.id === ORPHAN_TAB_ID) return -1;
				return 0;
			});
	}, [nodes, sections, itemOrder, nodeMap, sectionMap]);

	const [activeTab, setActiveTab] = useState<FrameTab>(tabs[0]);

	const resolvedActiveTab = useMemo(() => {

		if (activeTab && tabs.some((t) => t.id === activeTab.id)) return activeTab;
		return tabs[0];

	}, [tabs, activeTab]);

	const activeNodes = useMemo(
		() => nodes.filter((n) => n.topFrameId === resolvedActiveTab.id),
		[nodes, resolvedActiveTab],
	);

	const activeSections = useMemo(
		() => sections.filter((s) => s.topFrameId === resolvedActiveTab.id),
		[sections, resolvedActiveTab],
	);

	const activeItemOrder = useMemo(() => {
		const activeNodeIds = new Set(activeNodes.map((n) => n.id));
		const activeSectionIds = new Set(activeSections.map((s) => s.id));
		return itemOrder.filter((id) => activeNodeIds.has(id) || activeSectionIds.has(id));
	}, [itemOrder, activeNodes, activeSections]);

	return (
		<TabsContext.Provider value={{
			tabs,
			activeTab: resolvedActiveTab,
			setActiveTab: useCallback((id: string) => {
				const tab = tabs.find((t) => t.id === id);
				if (tab) {
					setActiveTab(tab);
				}
			}, [tabs]),
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
