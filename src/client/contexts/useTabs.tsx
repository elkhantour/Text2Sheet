import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { MarkedNode, NodeSection, FrameTab } from "@ctypes/messages";
import { ORPHAN_TAB_ID } from "../../lib/constants";
import { usePlugin } from "@contexts/usePlugin";

interface TabsContextValue {
	tabs: FrameTab[];
	activeTab: FrameTab | null;
	setActiveTab: (id: string) => void;
	activeNodes: MarkedNode[];
	activeSections: NodeSection[];
	activeItemOrder: string[];
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function TabsProvider({ children }: { children: React.ReactNode }) {
	const { markedNodes, sections, itemOrder } = usePlugin();

	const tabs = useMemo(() => {
		const frameNames = new Map<string, string>();

		for (const node of markedNodes) {
			if (!frameNames.has(node.topFrameId))
				frameNames.set(node.topFrameId, node.topFrameName);
		}
		for (const section of sections) {
			if (!frameNames.has(section.topFrameId))
				frameNames.set(section.topFrameId, section.topFrameName);
		}

		return Array.from(frameNames.entries())
			.map(([id, name]) => ({ id, name }))
			.sort((a, b) => {
				if (a.id === ORPHAN_TAB_ID) return 1;
				if (b.id === ORPHAN_TAB_ID) return -1;
				return 0;
			});
	}, [markedNodes, sections]);


	const [activeTab, setActiveTabState] = useState<FrameTab | null>(null);

	// Always resolve to a valid tab; fall back to first tab; null if no tabs exist
	const resolvedActiveTab = useMemo(() => {
		if (!tabs.length) return null;
		if (activeTab && tabs.some((t) => t.id === activeTab.id)) return activeTab;
		return tabs[0];
	}, [tabs, activeTab]);

	const setActiveTab = useCallback((id: string) => {
		const tab = tabs.find((t) => t.id === id);
		if (tab) setActiveTabState(tab);
	}, [tabs]);

	const activeNodes = useMemo(
		() => resolvedActiveTab
			? markedNodes.filter((n) => n.topFrameId === resolvedActiveTab.id)
			: [],
		[markedNodes, resolvedActiveTab],
	);

	const activeSections = useMemo(
		() => resolvedActiveTab
			? sections.filter((s) => s.topFrameId === resolvedActiveTab.id)
			: [],
		[sections, resolvedActiveTab],
	);

	const activeItemOrder = useMemo(() => {
		const activeIds = new Set([
			...activeNodes.map((n) => n.id),
			...activeSections.map((s) => s.id),
		]);
		return itemOrder.filter((id) => activeIds.has(id));
	}, [itemOrder, activeNodes, activeSections]);

	return (
		<TabsContext.Provider value={{
			tabs,
			activeTab: resolvedActiveTab,
			setActiveTab,
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
	if (!ctx) throw new Error("useTabs must be used within a <TabsProvider>");
	return ctx;
}
