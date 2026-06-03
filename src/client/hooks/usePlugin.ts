import { useEffect, useCallback, useState, useMemo } from "react";
import type { MarkedNode, NodeSection, UIToPluginMessage, PluginToUIMessage, ExportOptions, FrameTab } from "@ctypes/messages";
import { DEFAULT_EXPORT_OPTIONS } from "../../lib/constants";


export interface PluginHookReturn {
	markedNodes: MarkedNode[];
	isLoading: boolean;
	toast: { message: string; kind: "error" | "success" | "info" } | null;
	sections: NodeSection[];
	itemOrder: string[];
	exportOptions: ExportOptions;
	markSelection: () => void;
	highlightMarked: () => void;
	clearAll: () => void;
	unmarkNodes: (nodeId: string[]) => void;
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
	latestAddedNodes: string[];
	resizeWindow: (width: number, height: number) => void;
}

export function usePlugin(): PluginHookReturn {

	const [markedNodes, setMarkedNodes] = useState<MarkedNode[]>([]);
	const [sections, setSections] = useState<NodeSection[]>([]);
	const [itemOrder, setItemOrder] = useState<string[]>([]);
	const [exportOptions, setExportOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
	const [isLoading, setIsLoading] = useState(true);
	const [toast, setToast] = useState<PluginHookReturn["toast"]>(null);
	const [latestAddedNodes, setLatestAddedNodes] = useState<string[]>([]);

	useEffect(() => {
		if (!toast) return;
		const t = setTimeout(() => setToast(null), 3000);
		return () => clearTimeout(t);
	}, [toast]);

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
				case "ERROR": setToast({ message: msg.message, kind: "error" }); break;
				case "NOTIFY": setToast({ message: msg.message, kind: "success" }); break;
			}
		};
		window.addEventListener("message", handler);
		return () => window.removeEventListener("message", handler);
	}, []);

	useEffect(() => { postMessage({ type: "LOAD_MARKED" }); }, []);

	const saveExportOptions = useCallback((options: ExportOptions) => {
		setExportOptions(options);
		postMessage({ type: "SAVE_EXPORT_OPTIONS", options });
	}, []);

	const nodeMap = useMemo(() => {
		return new Map(markedNodes.map((n) => [n.id, n]));
	}, [markedNodes]);

	const sectionMap = useMemo(() => {
		return new Map(sections.map((s) => [s.id, s]));
	}, [sections]);


	return {
		markedNodes, sections, itemOrder, exportOptions, isLoading, toast, latestAddedNodes,
		markSelection: useCallback(() => postMessage({ type: "MARK_SELECTION" }), []),
		highlightMarked: useCallback(() => postMessage({ type: "HIGHLIGHT_MARKED" }), []),
		clearAll: useCallback(() => postMessage({ type: "CLEAR_ALL" }), []),
		unmarkNodes: useCallback((nodeIds) => postMessage({ type: "UNMARK_NODES", nodeIds }), []),
		selectNode: useCallback((nodeId) => postMessage({ type: "SELECT_NODE", nodeId }), []),
		dismissToast: useCallback(() => setToast(null), []),
		createSection: useCallback((name, tab) => postMessage({ type: "CREATE_SECTION", name, topFrameId: tab.id, topFrameName: tab.name }), []),
		deleteSection: useCallback((sectionId) => postMessage({ type: "DELETE_SECTION", sectionId }), []),
		renameSection: useCallback((sectionId, name) => postMessage({ type: "RENAME_SECTION", sectionId, name }), []),
		reorderItems: useCallback((itemIds) => postMessage({ type: "REORDER_ITEMS", itemIds }), []),
		moveNodesToSection: useCallback((nodeIds, sectionId, index) => postMessage({ type: "MOVE_NODES_TO_SECTION", nodeIds, sectionId, index }), []),
		reorderNodesInSection: useCallback((sectionId, nodeIds) => postMessage({ type: "REORDER_NODES_IN_SECTION", sectionId, nodeIds }), []),
		saveExportOptions,
		getNodeFromId: useCallback((id) => nodeMap.get(id), [nodeMap]),
		getSectionFromId: useCallback((id) => sectionMap.get(id), [sectionMap]),
		resizeWindow: useCallback((width: number, height: number) => {
			postMessage({ type: "RESIZE_WINDOW", width, height })
		}, [])
	};
}

function postMessage(msg: UIToPluginMessage): void {
	parent.postMessage({ pluginMessage: msg }, "*");
}
