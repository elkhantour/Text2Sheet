// PluginContext.tsx
import React, { createContext, useContext, useEffect, useCallback, useState, useMemo } from "react";
import type { MarkedNode, NodeSection, UIToPluginMessage, PluginToUIMessage, ExportOptions, FrameTab } from "@ctypes/messages";
import { DEFAULT_EXPORT_OPTIONS } from "../../lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PluginContextValue {
	markedNodes: MarkedNode[];
	isLoading: boolean;
	toast: { message: string; kind: "error" | "success" | "info" } | null;
	sections: NodeSection[];
	itemOrder: string[];
	exportOptions: ExportOptions;
	latestAddedNodes: string[];
	markSelection: () => void;
	highlightMarked: () => void;
	clearAll: () => void;
	unmarkNodes: (nodeIds: string[]) => void;
	selectNode: (nodeId: string) => void;
	dismissToast: () => void;
	createSection: (name: string, tab: FrameTab) => void;
	deleteSection: (sectionId: string) => void;
	renameSection: (sectionId: string, name: string) => void;
	reorderItems: (itemIds: string[]) => void;
	moveNodesToSection: (nodeIds: string[], sectionId: string | null, index: number) => void;
	reorderNodesInSection: (sectionId: string, nodeIds: string[]) => void;
	saveExportOptions: (options: ExportOptions) => void;
	getNodeFromId: (id: string) => MarkedNode | undefined;
	getSectionFromId: (id: string) => NodeSection | undefined;
	resizeWindow: (width: number, height: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PluginContext = createContext<PluginContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PluginProvider({ children }: { children: React.ReactNode }) {
	const [markedNodes, setMarkedNodes] = useState<MarkedNode[]>([]);
	const [sections, setSections] = useState<NodeSection[]>([]);
	const [itemOrder, setItemOrder] = useState<string[]>([]);
	const [exportOptions, setExportOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
	const [isLoading, setIsLoading] = useState(true);
	const [toast, setToast] = useState<PluginContextValue["toast"]>(null);
	const [latestAddedNodes, setLatestAddedNodes] = useState<string[]>([]);

	// Auto-dismiss toast after 3s
	useEffect(() => {
		if (!toast) return;
		const t = setTimeout(() => setToast(null), 3000);
		return () => clearTimeout(t);
	}, [toast]);

	// Listen for messages from the plugin
	useEffect(() => {
		const handler = (event: MessageEvent) => {
			const msg = event.data.pluginMessage as PluginToUIMessage;
			if (!msg) return;
			switch (msg.type) {
				case "MARKED_NODES_UPDATE":
					setMarkedNodes(msg.nodes);
					setIsLoading(false);
					break;
				case "STATE_UPDATE":
					setMarkedNodes(msg.nodes);
					setSections(msg.sections);
					setItemOrder(msg.itemOrder);
					setExportOptions(msg.exportOptions);
					setIsLoading(false);
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
	useEffect(() => { postMessage({ type: "LOAD_MARKED" }); }, []);

	// Lookup maps
	const nodeMap = useMemo(() => new Map(markedNodes.map((n) => [n.id, n])), [markedNodes]);
	const sectionMap = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);


	const value: PluginContextValue = {
		markedNodes, sections, itemOrder, exportOptions, isLoading, toast, latestAddedNodes,

		// ── No optimistic update: result depends on Figma's current selection ──
		markSelection: useCallback(() => postMessage({ type: "MARK_SELECTION" }), []),

		// ── No optimistic update: just a visual highlight in Figma, no state change ──
		highlightMarked: useCallback(() => postMessage({ type: "HIGHLIGHT_MARKED" }), []),
		selectNode: useCallback((nodeId) => postMessage({ type: "SELECT_NODE", nodeId }), []),
		resizeWindow: useCallback((width, height) => postMessage({ type: "RESIZE_WINDOW", width, height }), []),

		// ── Optimistic updates ─────────────────────────────────────────────────
		clearAll: useCallback(() => {
			setMarkedNodes([]);
			setSections([]);
			setItemOrder([]);
			postMessage({ type: "CLEAR_ALL" });
		}, []),

		unmarkNodes: useCallback((nodeIds) => {
			const idSet = new Set(nodeIds);
			setMarkedNodes(prev => prev.filter(n => !idSet.has(n.id)));
			setItemOrder(prev => prev.filter(id => !idSet.has(id)));
			postMessage({ type: "UNMARK_NODES", nodeIds });
		}, []),

		createSection: useCallback((name, tab) => {
			const newSection: NodeSection = {
				id: `section-${Date.now()}`,
				nodeIds: [],
				name,
				topFrameId: tab.id,
				topFrameName: tab.name,
			};
			setSections(prev => [...prev, newSection]);
			setItemOrder(prev => [...prev, newSection.id]);
			postMessage({ type: "CREATE_SECTION", name, sectionId: newSection.id, topFrameId: tab.id, topFrameName: tab.name });
		}, []),

		deleteSection: useCallback((sectionId) => {
			setSections(prev => {
				const target = prev.find(s => s.id === sectionId);
				if (!target) return prev;

				setItemOrder(order => {
					const sectionIdx = order.indexOf(sectionId);
					const newOrder = [...order];
					newOrder.splice(sectionIdx, 1, ...target.nodeIds);
					return newOrder;
				});

				return prev.filter(s => s.id !== sectionId);
			});

			postMessage({ type: "DELETE_SECTION", sectionId });
		}, []),

		renameSection: useCallback((sectionId, name) => {
			setSections(prev => prev.map(s => s.id === sectionId ? { ...s, name } : s));
			postMessage({ type: "RENAME_SECTION", sectionId, name });
		}, []),

		reorderItems: useCallback((itemIds) => {
			setItemOrder(itemIds);
			postMessage({ type: "REORDER_ITEMS", itemIds });
		}, []),

		moveNodesToSection: useCallback((nodeIds, sectionId, index) => {
			const idSet = new Set(nodeIds);

			// mirror: remove nodes from all sections, then insert into target
			setSections(prev => {
				const cleaned = prev.map(s => ({
					...s,
					nodeIds: s.nodeIds.filter(id => !idSet.has(id)),
				}));
				if (sectionId !== null) {
					const target = cleaned.find(s => s.id === sectionId);
					if (target) target.nodeIds.splice(index, 0, ...nodeIds);
				}
				return cleaned;
			});

			// mirror: only update itemOrder when moving to root (sectionId === null)
			if (sectionId === null) {
				setItemOrder(prev => {
					const cleaned = prev.filter(id => !idSet.has(id));
					cleaned.splice(index, 0, ...nodeIds);
					return cleaned;
				});
			} else {
				// nodes are now owned by the section, remove from root order
				setItemOrder(prev => prev.filter(id => !idSet.has(id)));
			}

			setMarkedNodes(prev => prev.map(n =>
				idSet.has(n.id) ? { ...n, sectionId: sectionId ?? undefined } : n
			));

			postMessage({ type: "MOVE_NODES_TO_SECTION", nodeIds, sectionId, index });
		}, []),

		reorderNodesInSection: useCallback((sectionId, nodeIds) => {
			setItemOrder(prev => {
				const rest = prev.filter(id => !nodeIds.includes(id));
				const insertAt = rest.findIndex(id => id === sectionId) + 1;
				rest.splice(insertAt, 0, ...nodeIds);
				return rest;
			});
			postMessage({ type: "REORDER_NODES_IN_SECTION", sectionId, nodeIds });
		}, []),

		saveExportOptions: useCallback((options) => {
			setExportOptions(options);
			postMessage({ type: "SAVE_EXPORT_OPTIONS", options });
		}, []),

		dismissToast: useCallback(() => setToast(null), []),
		getNodeFromId: useCallback((id) => nodeMap.get(id), [nodeMap]),
		getSectionFromId: useCallback((id) => sectionMap.get(id), [sectionMap]),
	};

	return (<PluginContext.Provider value={value} > {children} </PluginContext.Provider>);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlugin(): PluginContextValue {
	const ctx = useContext(PluginContext);
	if (!ctx) throw new Error("usePlugin must be used within a <PluginProvider>");
	return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function postMessage(msg: UIToPluginMessage): void {
	parent.postMessage({ pluginMessage: msg }, "*");
}
