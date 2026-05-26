import { useEffect, useCallback, useState } from "react";
import type { MarkedNode, NodeSection, UIToPluginMessage, PluginToUIMessage, ExportOptions } from "@ctypes/messages";
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
	unmarkNode: (nodeId: string) => void;
	selectNode: (nodeId: string) => void;
	dismissToast: () => void;
	createSection: (name: string, topFrameId: string) => void;
	deleteSection: (sectionId: string) => void;
	renameSection: (sectionId: string, name: string) => void;
	reorderItems: (itemIds: string[]) => void;
	moveNodeToSection: (nodeId: string, sectionId: string | null, index: number) => void;
	reorderNodesInSection: (sectionId: string, nodeIds: string[]) => void;
	saveExportOptions: (options: ExportOptions) => void;
}

export function usePlugin(): PluginHookReturn {
	const [markedNodes, setMarkedNodes] = useState<MarkedNode[]>([]);
	const [sections, setSections] = useState<NodeSection[]>([]);
	const [itemOrder, setItemOrder] = useState<string[]>([]);
	const [exportOptions, setExportOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
	const [isLoading, setIsLoading] = useState(true);
	const [toast, setToast] = useState<PluginHookReturn["toast"]>(null);

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

	return {
		markedNodes, sections, itemOrder, exportOptions, isLoading, toast,
		markSelection: useCallback(() => postMessage({ type: "MARK_SELECTION" }), []),
		highlightMarked: useCallback(() => postMessage({ type: "HIGHLIGHT_MARKED" }), []),
		clearAll: useCallback(() => postMessage({ type: "CLEAR_ALL" }), []),
		unmarkNode: useCallback((nodeId) => postMessage({ type: "UNMARK_NODE", nodeId }), []),
		selectNode: useCallback((nodeId) => postMessage({ type: "SELECT_NODE", nodeId }), []),
		dismissToast: useCallback(() => setToast(null), []),
		createSection: useCallback((name, topFrameId) => postMessage({ type: "CREATE_SECTION", name, topFrameId }), []),
		deleteSection: useCallback((sectionId) => postMessage({ type: "DELETE_SECTION", sectionId }), []),
		renameSection: useCallback((sectionId, name) => postMessage({ type: "RENAME_SECTION", sectionId, name }), []),
		reorderItems: useCallback((itemIds) => postMessage({ type: "REORDER_ITEMS", itemIds }), []),
		moveNodeToSection: useCallback((nodeId, sectionId, index) => postMessage({ type: "MOVE_NODE_TO_SECTION", nodeId, sectionId, index }), []),
		reorderNodesInSection: useCallback((sectionId, nodeIds) => postMessage({ type: "REORDER_NODES_IN_SECTION", sectionId, nodeIds }), []),
		saveExportOptions,
	};
}

function postMessage(msg: UIToPluginMessage): void {
	parent.postMessage({ pluginMessage: msg }, "*");
}
