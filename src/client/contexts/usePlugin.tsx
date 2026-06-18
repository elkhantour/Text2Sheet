// PluginContext.tsx
import React, { createContext, useContext, useEffect, useCallback, useState, useMemo } from "react";
import type { MarkedNode, NodeSection, UIToPluginMessage, PluginToUIMessage, ExportOptions, FrameTab, SelectionOptions, TreeNode, GlobalStats } from "@ctypes/messages";
import { DEFAULT_EXPORT_OPTIONS, DEFAULT_SELECTION_OPTIONS } from "../../lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PluginContextValue {
	// ── Global state ──────────────────────────────────────────────────────────
	exportOptions: ExportOptions;
	selectionOptions: SelectionOptions;
	isLoading: boolean;
	toast: { message: string; kind: "error" | "success" | "info" } | null;
	latestAddedNodes: string[];
	tree: TreeNode[];
	globalStats: GlobalStats;

	// ── Tab state ─────────────────────────────────────────────────────────────
	tabs: FrameTab[];
	activeTab: FrameTab | null;
	setActiveTab: (id: string) => void;

	// ── Actions ───────────────────────────────────────────────────────────────
	markSelection: () => void;
	highlightMarked: () => void;
	clearAll: () => void;
	unmarkNodes: (nodeIds: string[]) => void;
	selectNode: (nodeId: string) => void;
	dismissToast: () => void;
	createSection: (name: string, tab: FrameTab) => void;
	deleteSection: (sectionId: string, tabId: string) => void;
	renameSection: (sectionId: string, name: string) => void;
	reorderItems: (tabId: string, itemIds: string[]) => void;
	moveNodesToSection: (nodeIds: string[], sectionId: string | null, index: number) => void;
	reorderNodesInSection: (sectionId: string, nodeIds: string[]) => void;
	saveExportOptions: (options: ExportOptions) => void;
	saveSelectionOptions: (options: SelectionOptions) => void;
	getNodeFromId: (id: string) => MarkedNode | undefined;
	getSectionFromId: (tabId: string, sectionId: string) => NodeSection | undefined;
	resizeWindow: (width: number, height: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PluginContext = createContext<PluginContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function postMessage(msg: UIToPluginMessage): void {
	parent.postMessage({ pluginMessage: msg }, "*");
}

function mergeTabs(prev: FrameTab[], updated: FrameTab): FrameTab[] {
	const exists = prev.some(t => t.id === updated.id);
	return exists ? prev.map(t => t.id === updated.id ? updated : t) : [...prev, updated];
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PluginProvider({ children }: { children: React.ReactNode }) {
	const [tabs, setTabs] = useState<FrameTab[]>([]);
	const [exportOptions, setExportOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
	const [selectionOptions, setSelectionOptions] = useState<SelectionOptions>(DEFAULT_SELECTION_OPTIONS);

	const [activeTab, setActiveTabInternal] = useState<FrameTab | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [toast, setToast] = useState<PluginContextValue["toast"]>(null);
	const [latestAddedNodes, setLatestAddedNodes] = useState<string[]>([]);
	const [tree, setTree] = useState<TreeNode[]>([]);
	const [globalStats, setGlobalStats] = useState<GlobalStats>({ rowsCount: 0, pagesCount: 0 });

	// Auto-dismiss toast after 3s
	useEffect(() => {
		if (!toast) return;
		const t = setTimeout(() => setToast(null), 3000);
		return () => clearTimeout(t);
	}, [toast]);

	// ── Message handler ───────────────────────────────────────────────────────

	useEffect(() => {
		const handler = (event: MessageEvent) => {
			const msg = event.data.pluginMessage as PluginToUIMessage;
			if (!msg) return;

			switch (msg.type) {
				case "STATE_UPDATE":
					setTree(msg.tree);
					setExportOptions(msg.exportOptions);
					setSelectionOptions(msg.selectionOptions);
					setGlobalStats(msg.globalStats);
					setIsLoading(false);
					break;

				case "TAB_RESOLVED":
					setTabs(tabs => msg.tab && [...tabs, msg.tab] || tabs);
					setActiveTabInternal(msg.tab);
					break;

				case "TAB_UPDATED":
					setTabs(prev => mergeTabs(prev, msg.tab));
					setGlobalStats(msg.globalStats);
					setLatestAddedNodes(msg.tab.nodes.map(n => n.id));
					break;

				case "LATEST_ADDED_NODES":
					setLatestAddedNodes(msg.nodeIds);
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

	// Initial load
	useEffect(() => { postMessage({ type: "INIT_LOAD" }); }, []);

	// ── Active tab ────────────────────────────────────────────────────────────

	const setActiveTab = useCallback((id: string) => {
		// look up if tab is alrady cached client side
		// else resolve tab server side
		let activeTab = tabs.find(t => t.id === id);
		if (!activeTab)
			postMessage({ type: "RESOLVE_TAB", tabId: id });
		else
			setActiveTabInternal(activeTab);
	}, [tabs]);

	// ── Lookup maps ───────────────────────────────────────────────────────────

	const nodeMap = useMemo(() => {
		const map = new Map<string, MarkedNode>();
		for (const tab of tabs) {
			for (const node of tab.nodes) map.set(node.id, node);
			for (const section of tab.sections)
				for (const node of section.nodes) map.set(node.id, node);
		}
		return map;
	}, [tabs]);

	// ── Context value ─────────────────────────────────────────────────────────

	const value: PluginContextValue = {
		exportOptions, selectionOptions,
		isLoading, toast, latestAddedNodes,
		tabs, activeTab, setActiveTab,
		tree, globalStats,

		markSelection: useCallback(() => postMessage({ type: "MARK_SELECTION" }), []),
		highlightMarked: useCallback(() => postMessage({ type: "HIGHLIGHT_MARKED" }), []),
		selectNode: useCallback((nodeId) => postMessage({ type: "SELECT_NODE", nodeId }), []),
		resizeWindow: useCallback((width, height) => postMessage({ type: "RESIZE_WINDOW", width, height }), []),

		clearAll: useCallback(() => {
			setTabs([]);
			setActiveTabInternal(null);
			postMessage({ type: "CLEAR_ALL" });
		}, []),

		unmarkNodes: useCallback((nodeIds) => {
			const idSet = new Set(nodeIds);
			setTabs(prev => prev.map(t => ({
				...t,
				nodes: t.nodes.filter(n => !idSet.has(n.id)),
				sections: t.sections.map(s => ({
					...s,
					nodes: s.nodes.filter(n => !idSet.has(n.id)),
				})),
				itemOrder: t.itemOrder.filter(id => !idSet.has(id)),
			})).filter(t => t.nodes.length > 0 || t.sections.some(s => s.nodes.length > 0)));
			postMessage({ type: "UNMARK_NODES", nodeIds });
		}, []),

		createSection: useCallback((name, tab) => {
			const newSection: NodeSection = {
				id: `section-${Date.now()}`,
				name,
				nodes: [],
				topFrameId: tab.id,
			};
			setTabs(prev => prev.map(t =>
				t.id === tab.id
					? { ...t, sections: [...t.sections, newSection], itemOrder: [...t.itemOrder, newSection.id] }
					: t
			));
			postMessage({ type: "CREATE_SECTION", name, sectionId: newSection.id, tabId: tab.id });
		}, []),

		deleteSection: useCallback((sectionId, tabId) => {
			setTabs(prev => prev.map(t => {
				if (t.id !== tabId) return t;
				const target = t.sections.find(s => s.id === sectionId);
				if (!target) return t;
				return {
					...t,
					nodes: [...t.nodes, ...target.nodes],
					sections: t.sections.filter(s => s.id !== sectionId),
					itemOrder: t.itemOrder.flatMap(id =>
						id === sectionId ? target.nodes.map(n => n.id) : [id]
					),
				};
			}));
			postMessage({ type: "DELETE_SECTION", sectionId, tabId });
		}, []),

		renameSection: useCallback((sectionId, name) => {
			setTabs(prev => prev.map(t => ({
				...t,
				sections: t.sections.map(s => s.id === sectionId ? { ...s, name } : s),
			})));
			postMessage({ type: "RENAME_SECTION", sectionId, name });
		}, []),

		reorderItems: useCallback((tabId, itemIds) => {
			setTabs(prev => prev.map(t => {

				if (t.id === tabId) {
					const newTab = { ...t, itemOrder: itemIds };
					setActiveTabInternal(newTab);
					return newTab;
				}

				return t;
			}));
			postMessage({ type: "REORDER_ITEMS", tabId, itemIds });
		}, []),

		moveNodesToSection: useCallback((nodeIds, sectionId, index) => {
			const idSet = new Set(nodeIds);
			setTabs(prev => prev.map(t => {
				// Collect the actual node objects being moved
				const movingNodes = [
					...t.nodes.filter(n => idSet.has(n.id)),
					...t.sections.flatMap(s => s.nodes.filter(n => idSet.has(n.id))),
				];

				const cleanedNodes = t.nodes.filter(n => !idSet.has(n.id));
				const cleanedSections = t.sections.map(s => ({
					...s,
					nodes: s.nodes.filter(n => !idSet.has(n.id)),
				}));

				if (sectionId !== null) {
					return {
						...t,
						nodes: cleanedNodes,
						sections: cleanedSections.map(s => {
							if (s.id !== sectionId) return s;
							const next = [...s.nodes];
							next.splice(index, 0, ...movingNodes);
							return { ...s, nodes: next };
						}),
						itemOrder: t.itemOrder.filter(id => !idSet.has(id)),
					};
				} else {
					const newItemOrder = t.itemOrder.filter(id => !idSet.has(id));
					newItemOrder.splice(index, 0, ...nodeIds);
					return {
						...t,
						nodes: [...cleanedNodes, ...movingNodes],
						sections: cleanedSections,
						itemOrder: newItemOrder,
					};
				}
			}));
			postMessage({ type: "MOVE_NODES_TO_SECTION", nodeIds, sectionId, index });
		}, []),

		reorderNodesInSection: useCallback((sectionId, nodeIds) => {
			setTabs(prev => prev.map(t => ({
				...t,
				sections: t.sections.map(s => {
					if (s.id !== sectionId) return s;
					const nodeMap = new Map(s.nodes.map(n => [n.id, n]));
					return { ...s, nodes: nodeIds.map(id => nodeMap.get(id)!).filter(Boolean) };
				}),
			})));
			postMessage({ type: "REORDER_NODES_IN_SECTION", sectionId, nodeIds });
		}, []),

		saveExportOptions: useCallback((options) => {
			setExportOptions(options);
			postMessage({ type: "SAVE_EXPORT_OPTIONS", options });
		}, []),

		saveSelectionOptions: useCallback((options) => {
			setSelectionOptions(options);
			postMessage({ type: "SAVE_SELECTION_OPTIONS", options });
		}, []),

		dismissToast: useCallback(() => setToast(null), []),
		getNodeFromId: useCallback((id) => nodeMap.get(id), [nodeMap]),
		getSectionFromId: useCallback((tabId, sectionId) =>
			tabs.find(t => t.id === tabId)?.sections.find(s => s.id === sectionId),
			[tabs]
		),
	};

	return (<PluginContext.Provider value={value}>{children}</PluginContext.Provider>);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlugin(): PluginContextValue {
	const ctx = useContext(PluginContext);
	if (!ctx) throw new Error("usePlugin must be used within a <PluginProvider>");
	return ctx;
}
