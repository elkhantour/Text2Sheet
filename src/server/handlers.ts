import { clearCacheResolvedTab, getCacheResolvedTabsArray } from "./cache";
import { PLUGIN_HEIGHT, PLUGIN_WIDTH } from "./constants";
import { collectTextNodes, findOrCreateTab, processAutogroup, pushLoadingNotif, updateTabCacheStorage, upsertTab } from "./handlers.helper";
import { sendError, sendSuccess, sendToUI } from "./message";
import { resolveNode, getTopFrame, loadAndSendState, computeGlobalStats, resolveTab } from "./node";
import {
	getStoredTabs,
	saveExportOptions,
	saveSelectionOptions,
	getSelectionOptions,
	storeTabs,
} from "./storage";
import type { ExportOptions, FrameTab, NodeSection, SelectionOptions } from "@ctypes/messages";


// ─── Mark selection ───────────────────────────────────────────────────────────

export async function handleMarkSelection(): Promise<void> {
	// DEBUG const debugStart = Date.now();
	let nodeCount = { value: 0 };

	figma.skipInvisibleInstanceChildren = true;

	const selection = figma.currentPage.selection;
	if (selection.length === 0) { sendError("Select at least one layer in the canvas first."); return; }

	const { autogroup, filters } = getSelectionOptions();
	let tabs = getCacheResolvedTabsArray();
	const addedNodeIds: string[] = [];

	for (const sel of selection) {
		const { id: tabId, name: tabName } = getTopFrame(sel);
		let tab = findOrCreateTab(tabs, tabId, tabName);

		if (autogroup && "children" in sel) {
			await processAutogroup(sel, tab, tabId, filters, addedNodeIds, nodeCount);
		} else {
			for (const t of collectTextNodes(sel, filters)) {
				const node = resolveNode(t);
				if (!tab.nodes.some(n => n.id === node.id)) {
					tab.nodes.push(node);
					if (!tab.itemOrder.includes(node.id)) tab.itemOrder.push(node.id);
					await pushLoadingNotif(nodeCount);
					addedNodeIds.push(node.id);
				}
			}
		}

		tabs = upsertTab(tabs, tab);
		updateTabCacheStorage(tab);
	}


	loadAndSendState();
	sendToUI({ type: "LATEST_ADDED_NODES", nodeIds: addedNodeIds });
	sendSuccess(`Marked ${addedNodeIds.length} layer${addedNodeIds.length !== 1 ? "s" : ""} for export.`);
	// DEBUG console.log(`[markSelection] ${addedNodeIds.length} nodes added in ${Date.now() - debugStart}ms`);
}


// ─── Unmark ───────────────────────────────────────────────────────────────────

export async function handleUnmarkNodeList(nodeIds: string[]): Promise<void> {
	const idSet = new Set(nodeIds);
	const tabs = getCacheResolvedTabsArray();

	const updatedTabs = tabs
		.map(tab => ({
			...tab,
			nodes: tab.nodes.filter(n => !idSet.has(n.id)),
			sections: tab.sections.map(s => ({
				...s,
				nodes: s.nodes.filter(n => !idSet.has(n.id)),
			})),
			itemOrder: tab.itemOrder.filter(id => !idSet.has(id)),
		}))
		.filter(tab => tab.nodes.length > 0 || tab.sections.some(s => s.nodes.length > 0));

	updatedTabs.forEach(updateTabCacheStorage);
	const globalStats = computeGlobalStats(updatedTabs);

	// Send TAB_UPDATED for each affected tab (or remove it if now empty)
	for (const original of tabs) {
		const updated = updatedTabs.find(t => t.id === original.id);
		if (updated) sendToUI({ type: "TAB_UPDATED", tab: updated, globalStats });
		// Removed tabs: UI handles that via unmarkNodes optimistic update
	}
}


// ─── Select / highlight ───────────────────────────────────────────────────────

export async function handleHighlightMarked(): Promise<void> {
	const tabs = getCacheResolvedTabsArray();
	const allNodeIds = tabs.flatMap(t => [
		...t.nodes.map(n => n.id),
		...t.sections.flatMap(s => s.nodes.map(n => n.id)),
	]);

	const nodes = await Promise.all(allNodeIds.map(id => figma.getNodeByIdAsync(id)));
	const validNodes = nodes.filter((n): n is SceneNode => n !== null && "parent" in n && n.parent !== null);

	if (validNodes.length === 0) { sendError("No marked layers found in this file."); return; }
	figma.currentPage.selection = validNodes;
	figma.viewport.scrollAndZoomIntoView(validNodes);
	sendSuccess(`Highlighted ${validNodes.length} marked layer${validNodes.length !== 1 ? "s" : ""}.`);
}

export async function handleSelectNode(nodeId: string): Promise<void> {
	const node = await figma.getNodeByIdAsync(nodeId);
	if (!node) { sendError("Layer no longer exists in this file."); return; }
	if (!("parent" in node) || node.parent === null) { sendError("Cannot select this node."); return; }
	figma.currentPage.selection = [node as SceneNode];
	figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
}

export async function handleSyncSelectionToUI(): Promise<void> {

	const tabs = getCacheResolvedTabsArray();
	const allNodeIds = new Set(tabs.flatMap(t => [
		...t.nodes.map(n => n.id),
		...t.sections.flatMap(s => s.nodes.map(n => n.id)),
	]));

	const selectedStoredIds: string[] = [];
	function visit(node: SceneNode) {
		if (allNodeIds.has(node.id)) selectedStoredIds.push(node.id);
		if ("children" in node) node.children.forEach(visit);
	}
	figma.currentPage.selection.forEach(visit);

	sendToUI({ type: "SELECT_NODES", nodeIds: selectedStoredIds });
}


// ─── Clear all ────────────────────────────────────────────────────────────────

export function handleClearAll(): void {
	storeTabs([]);
	clearCacheResolvedTab();
	loadAndSendState();
	sendSuccess("Cleared all marked layers.");
}


// ─── Section handlers ─────────────────────────────────────────────────────────

export async function handleCreateSection(name: string, sectionId: string, tabId: string): Promise<void> {
	const tabs = getCacheResolvedTabsArray();
	const tab = tabs.find(t => t.id === tabId);
	if (!tab) return;

	const newSection: NodeSection = { id: sectionId, name, nodes: [], topFrameId: tabId };
	const updated: FrameTab = {
		...tab,
		sections: [...tab.sections, newSection],
		itemOrder: [...tab.itemOrder, sectionId],
	};

	updateTabCacheStorage(updated);
	// Already handled optimistically client-side
}

export async function handleDeleteSection(tabId: string, sectionId: string): Promise<void> {

	const tabs = getCacheResolvedTabsArray();
	const tab = tabs.find(t => t.id === tabId);

	if (!tab) return;

	const target = tab.sections.find(s => s.id === sectionId);
	if (!target) return;

	const updated: FrameTab = {
		...tab,
		nodes: [...tab.nodes, ...target.nodes],
		sections: tab.sections.filter(s => s.id !== sectionId),
		itemOrder: tab.itemOrder.flatMap(id =>
			id === sectionId ? target.nodes.map(n => n.id) : [id]
		),
	};

	updateTabCacheStorage(updated);
	// Already handled optimistically client-side
}

export async function handleRenameSection(sectionId: string, name: string): Promise<void> {
	const tabs = getCacheResolvedTabsArray();
	const tab = tabs.find(t => t.sections.some(s => s.id === sectionId));
	if (!tab) return;

	const updated: FrameTab = {
		...tab,
		sections: tab.sections.map(s => s.id === sectionId ? { ...s, name } : s),
	};

	updateTabCacheStorage(updated);
	// Already handled optimistically client-side
}

export async function handleReorderItems(tabId: string, itemIds: string[]): Promise<void> {
	const tabs = getCacheResolvedTabsArray();
	const tab = tabs.find(t => t.id === tabId);
	if (!tab) return;

	updateTabCacheStorage({ ...tab, itemOrder: itemIds });
	// Already handled optimistically client-side
}

export async function handleResolveTab(tabId: string): Promise<void> {
	const tabs = getStoredTabs();
	const tab = tabs.find(t => t.id === tabId);
	let resolvedTab = tab ? await resolveTab(tab) : null;

	sendToUI({ type: "TAB_RESOLVED", tab: resolvedTab });
}

export async function handleMoveNodeListToSection(
	nodeIds: string[],
	sectionId: string | null,
	index: number
): Promise<void> {
	const idSet = new Set(nodeIds);
	const tabs = getCacheResolvedTabsArray();

	// Find which tab owns these nodes
	const tab = tabs.find(t =>
		t.nodes.some(n => idSet.has(n.id)) ||
		t.sections.some(s => s.nodes.some(n => idSet.has(n.id)))
	);
	if (!tab) return;

	// Collect the actual node objects being moved
	const movingNodes = [
		...tab.nodes.filter(n => idSet.has(n.id)),
		...tab.sections.flatMap(s => s.nodes.filter(n => idSet.has(n.id))),
	];

	const cleanedNodes = tab.nodes.filter(n => !idSet.has(n.id));
	const cleanedSections = tab.sections.map(s => ({
		...s,
		nodes: s.nodes.filter(n => !idSet.has(n.id)),
	}));

	let updated: FrameTab;
	if (sectionId === null) {
		const newItemOrder = tab.itemOrder.filter(id => !idSet.has(id));
		newItemOrder.splice(index, 0, ...nodeIds);
		updated = {
			...tab,
			nodes: [...cleanedNodes, ...movingNodes],
			sections: cleanedSections,
			itemOrder: newItemOrder,
		};
	} else {
		const targetSection = cleanedSections.find(s => s.id === sectionId);
		if (!targetSection) return;
		targetSection.nodes.splice(index, 0, ...movingNodes);
		updated = {
			...tab,
			nodes: cleanedNodes,
			sections: cleanedSections,
			itemOrder: tab.itemOrder.filter(id => !idSet.has(id)),
		};
	}

	updateTabCacheStorage(updated);
	// Already handled optimistically client-side
}

export async function handleReorderNodesInSection(sectionId: string, nodeIds: string[]): Promise<void> {
	const tabs = getCacheResolvedTabsArray();
	const tab = tabs.find(t => t.sections.some(s => s.id === sectionId));
	if (!tab) return;

	const updated: FrameTab = {
		...tab,
		sections: tab.sections.map(s => {
			if (s.id !== sectionId) return s;
			const nodeMap = new Map(s.nodes.map(n => [n.id, n]));
			return { ...s, nodes: nodeIds.map(id => nodeMap.get(id)!).filter(Boolean) };
		}),
	};

	updateTabCacheStorage(updated);
	// Already handled optimistically client-side
}


// ─── Options ──────────────────────────────────────────────────────────────────

export async function handleSaveExportOptions(options: ExportOptions): Promise<void> {
	saveExportOptions(options);
}

export async function handleSaveSelectionOptions(options: SelectionOptions): Promise<void> {
	saveSelectionOptions(options);
}




// ─── Window ───────────────────────────────────────────────────────────────────

export function handleResizeWindow(width: number, height: number): void {
	width = Math.max(Math.round(width), PLUGIN_WIDTH);
	height = Math.max(Math.round(height), PLUGIN_HEIGHT);
	figma.ui.resize(width, height);
}
