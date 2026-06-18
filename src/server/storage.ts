import { DEFAULT_EXPORT_OPTIONS, DEFAULT_SELECTION_OPTIONS } from "../lib/constants";
import {
	EXPORT_OPTIONS_KEY,
	SELECTION_OPTIONS_KEY,
	TABS_KEY,
} from "./constants";
import type {
	ExportOptions,
	FrameTab,
	NodeSection,
	SelectionOptions,
	StoredNodeSection,
	StoredTab,
} from "@ctypes/messages";
import { resolveNode } from "./node";


// ─── Helpers   ────────────────────────────────────────────────────────────────

function sectionToStorage(section: NodeSection): StoredNodeSection {
	return {
		name: section.name,
		id: section.id,
		nodes: section.nodes.map(n => n.id)
	};
}

function tabToStorage({ id, name, nodes, sections, itemOrder }: FrameTab): StoredTab {
	return {
		id,
		name,
		nodes: nodes.map(n => n.id),
		sections: sections.map(sectionToStorage),
		itemOrder,
	};
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

/** Returns the full persisted tab list (shells only — no MarkedNode data) */
export function getStoredTabs(): StoredTab[] {
	const raw = JSON.parse(figma.root.getPluginData(TABS_KEY) || "[]");
	if (Array.isArray(raw)) return raw as StoredTab[];
	return [];
}

/** Persists the full tab list */
export function storeTabs(tabs: FrameTab[]): void {
	figma.root.setPluginData(TABS_KEY, JSON.stringify(tabs.map(tabToStorage)));
}

/** Adds or replaces a single tab by id */
export function storeTab(tab: FrameTab): void {
	const tabs = getStoredTabs();
	const idx = tabs.findIndex(t => t.id === tab.id);
	const convertedTab = tabToStorage(tab);

	if (idx !== -1) tabs[idx] = convertedTab;
	else tabs.push(convertedTab);
	figma.root.setPluginData(TABS_KEY, JSON.stringify(tabs));
}

/** Removes a tab from persisted storage */
export function removeTab(tabId: string): void {
	const tabs = getStoredTabs().filter(t => t.id !== tabId);
	figma.root.setPluginData(TABS_KEY, JSON.stringify(tabs));
}



// ─── Tab node resolution ──────────────────────────────────────────────────────

/**
	* Resolves all MarkedNodes for a tab by walking its nodeIds + section nodeIds
	* through the Figma API. Returns live node data — nothing is cached.
	*/
export async function resolveTabNodes(tab: FrameTab) {
	const allNodeIds = [
		...tab.nodes.map(n => n.id),
		...tab.sections.flatMap(s => s.nodes.map(n => n.id)),
	];

	const resolved = await Promise.all(
		allNodeIds.map(async (id) => {
			const node = await figma.getNodeByIdAsync(id);
			return node ? resolveNode(node) : [];
		})
	);

	return resolved.flat();
}

/**
	* Resolves MarkedNodes for all tabs at once (e.g. on plugin launch).
	* Returns a map of tabId → MarkedNode[] for the caller to assemble FrameTabs.
	*/
export async function resolveAllTabNodes(tabs: FrameTab[]): Promise<Map<string, Awaited<ReturnType<typeof resolveTabNodes>>>> {
	const entries = await Promise.all(
		tabs.map(async (tab) => [tab.id, await resolveTabNodes(tab)] as const)
	);
	return new Map(entries);
}



// ─── Options ──────────────────────────────────────────────────────────────────

export function getExportOptions(): ExportOptions {
	const raw = JSON.parse(figma.root.getPluginData(EXPORT_OPTIONS_KEY) || "{}");
	if (raw && typeof raw === "object") return { ...DEFAULT_EXPORT_OPTIONS, ...(raw as Partial<ExportOptions>) };
	return { ...DEFAULT_EXPORT_OPTIONS };
}

export function saveExportOptions(options: ExportOptions): void {
	figma.root.setPluginData(EXPORT_OPTIONS_KEY, JSON.stringify(options));
}

export function getSelectionOptions(): SelectionOptions {
	const raw = JSON.parse(figma.root.getPluginData(SELECTION_OPTIONS_KEY) || "{}");

	if (raw && typeof raw === "object") return { ...DEFAULT_SELECTION_OPTIONS, ...(raw as Partial<SelectionOptions>) };
	return { ...DEFAULT_SELECTION_OPTIONS };
}

export function saveSelectionOptions(options: SelectionOptions): void {
	figma.root.setPluginData(SELECTION_OPTIONS_KEY, JSON.stringify(options));
}
