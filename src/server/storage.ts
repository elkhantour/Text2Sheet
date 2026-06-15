import { DEFAULT_EXPORT_OPTIONS, DEFAULT_SELECTION_OPTIONS } from "../lib/constants";
import { EXPORT_OPTIONS_KEY, ITEM_ORDER_KEY, SECTIONS_KEY, SELECTION_OPTIONS_KEY, STORAGE_KEY } from "./constants";
import type { NodeSection, ExportOptions, SelectionOptions, MarkedNode } from "@ctypes/messages";
import { resolveNode } from "./node";
import { sendNotify } from "./message";

var CACHED_NODES: Map<string, MarkedNode> = new Map();


// ─── Cached Marked Nodes  ──────────────────────────────────────────────────────

export function addCachedNode(node: MarkedNode) {
	CACHED_NODES.set(node.id, node);
}

export function removeCachedNode(id: string) {
	CACHED_NODES.delete(id);
}

/**
	* Initialise Cached Nodes map from stored Ids 
	* @description Used at the plugin launch,
	* we store ids instead of full node to save up PluginData space
	* 
	*/
export async function initCachedNodes() {
	const storedIds = getStoredIds();

	let nodeCount = 0;
	return Promise.all(storedIds.map(async (id) => {
		const node = await figma.getNodeByIdAsync(id);
		if (node)
			resolveNode(node).forEach((child) => addCachedNode(child));
		sendNotify(`Loading node ${nodeCount}/${storedIds.length}`);
		return;
	}));

}

export function clearCachedNodes() {
	CACHED_NODES.clear();
}

export function getCachedNodesArray() {
	return [...CACHED_NODES.values()];
}

// ─── Node IDs ─────────────────────────────────────────────────────────────────
export function getStoredIds(): string[] {
	const raw = JSON.parse(figma.root.getPluginData(STORAGE_KEY) || "[]");
	if (Array.isArray(raw)) return raw as string[];
	return [];
}
export function saveIds(ids: string[]): void {
	figma.root.setPluginData(STORAGE_KEY, JSON.stringify(ids));
}

// ─── Sections ─────────────────────────────────────────────────────────────────
export function getSections(): NodeSection[] {
	const raw = JSON.parse(figma.root.getPluginData(SECTIONS_KEY) || "[]");
	if (Array.isArray(raw)) return raw as NodeSection[];
	return [];
}
export function saveSections(sections: NodeSection[]): void {
	figma.root.setPluginData(SECTIONS_KEY, JSON.stringify(sections));
}

// ─── Item order ───────────────────────────────────────────────────────────────
export function getItemOrder(): string[] {
	const raw = JSON.parse(figma.root.getPluginData(ITEM_ORDER_KEY) || "[]");
	if (Array.isArray(raw)) return raw as string[];
	return [];
}
export function saveItemOrder(order: string[]): void {
	figma.root.setPluginData(ITEM_ORDER_KEY, JSON.stringify(order));
}

// ─── Options ───────────────────────────────────────────────────────────
export function getExportOptions(): ExportOptions {
	const raw = JSON.parse(figma.root.getPluginData(EXPORT_OPTIONS_KEY) || "{}");
	if (raw && typeof raw === "object") return { ...DEFAULT_EXPORT_OPTIONS, ...(raw as Partial<ExportOptions>) };
	return { ...DEFAULT_EXPORT_OPTIONS };
}

export function saveExportOptions(options: ExportOptions): void {
	figma.root.setPluginData(EXPORT_OPTIONS_KEY, JSON.stringify(options));
}

export function saveSelectionOptions(options: SelectionOptions): void {
	figma.root.setPluginData(SELECTION_OPTIONS_KEY, JSON.stringify(options));
}

export function getSelectionOptions(): SelectionOptions {
	const raw = JSON.parse(figma.root.getPluginData(SELECTION_OPTIONS_KEY) || "{}");
	if (raw && typeof raw === "object") return { ...DEFAULT_SELECTION_OPTIONS, ...(raw as Partial<SelectionOptions>) };
	return { ...DEFAULT_SELECTION_OPTIONS };
}
