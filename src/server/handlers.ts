import { PLUGIN_HEIGHT, PLUGIN_WIDTH } from "./constants";
import { sendError, sendNotify, sendToUI } from "./message";
import { resolveNode, getTopFrame } from "./node";
import {
	getStoredTabs,
	saveTab,
	saveTabs,
	saveExportOptions,
	saveSelectionOptions,
	getSelectionOptions,
} from "./storage";
import type { ExportOptions, FrameTab, NodeSection, SelectionOptions } from "@ctypes/messages";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findOrCreateTab(tabs: FrameTab[], tabId: string, tabName: string): FrameTab {
	return tabs.find(t => t.id === tabId) ?? {
		id: tabId,
		name: tabName,
		nodes: [],
		sections: [],
		itemOrder: [],
	};
}

function upsertTab(tabs: FrameTab[], tab: FrameTab): FrameTab[] {
	const exists = tabs.some(t => t.id === tab.id);
	return exists ? tabs.map(t => t.id === tab.id ? tab : t) : [...tabs, tab];
}


// ─── Mark selection ───────────────────────────────────────────────────────────

export async function handleMarkSelection(): Promise<void> {
	const debugStart = Date.now();
	figma.skipInvisibleInstanceChildren = true;

	const selection = figma.currentPage.selection;
	if (selection.length === 0) { sendError("Select at least one layer in the canvas first."); return; }

	const { autogroup } = getSelectionOptions();
	let tabs = getStoredTabs();
	const addedNodeIds: string[] = [];

	// Collect all text nodes under a node
	function collectTextNodes(node: SceneNode): SceneNode[] {
		if (!node.visible) return [];
		if (node.type === "TEXT") return [node];
		if (!("findAllWithCriteria" in node)) return [];
		return node.findAllWithCriteria({ types: ["TEXT"] }).filter(n => n.visible);
	}

	const isSectionable = (node: SceneNode) =>
		node.type === "GROUP" || node.type === "FRAME";

	for (const sel of selection) {
		const { id: tabId, name: tabName } = getTopFrame(sel);
		let tab = findOrCreateTab(tabs, tabId, tabName);

		if (autogroup && "children" in sel) {
			for (const child of sel.children) {
				if (!child.visible) continue;

				if (child.type === "TEXT") {
					const node = resolveNode(child);
					if (!tab.nodes.some(n => n.id === node.id)) {
						tab.nodes.push(node);
						if (!tab.itemOrder.includes(node.id)) tab.itemOrder.push(node.id);
						addedNodeIds.push(node.id);
					}
					continue;
				}

				if (isSectionable(child)) {
					const textNodes = collectTextNodes(child);
					if (textNodes.length === 0) continue;

					const existingSection = tab.sections.find(s => s.id === child.id);
					if (existingSection) {
						const existingIds = new Set(existingSection.nodes.map(n => n.id));
						for (const t of textNodes) {
							if (!existingIds.has(t.id)) {
								const node = resolveNode(t);
								existingSection.nodes.push(node);
								addedNodeIds.push(node.id);
							}
						}
						existingSection.name = child.name;
					} else {
						const nodes = textNodes.map(t => resolveNode(t));
						const newSection: NodeSection = {
							id: child.id,
							name: child.name,
							topFrameId: tabId,
							nodes,
						};
						tab.sections.push(newSection);
						if (!tab.itemOrder.includes(child.id)) tab.itemOrder.push(child.id);
						addedNodeIds.push(...nodes.map(n => n.id));
					}
				} else {
					for (const t of collectTextNodes(child)) {
						const node = resolveNode(t);
						if (!tab.nodes.some(n => n.id === node.id)) {
							tab.nodes.push(node);
							if (!tab.itemOrder.includes(node.id)) tab.itemOrder.push(node.id);
							addedNodeIds.push(node.id);
						}
					}
				}
			}
		} else {
			for (const t of collectTextNodes(sel)) {
				const node = resolveNode(t);
				if (!tab.nodes.some(n => n.id === node.id)) {
					tab.nodes.push(node);
					if (!tab.itemOrder.includes(node.id)) tab.itemOrder.push(node.id);
					addedNodeIds.push(node.id);
				}
			}
		}

		tabs = upsertTab(tabs, tab);
		saveTab(tab);
		sendToUI({ type: "TAB_UPDATED", tab });
	}

	sendToUI({ type: "LATEST_ADDED_NODES", nodeIds: addedNodeIds });
	sendNotify(`Marked ${addedNodeIds.length} layer${addedNodeIds.length !== 1 ? "s" : ""} for export.`);

	console.log(`[markSelection] ${addedNodeIds.length} nodes added in ${Date.now() - debugStart}ms`);
}


// ─── Unmark ───────────────────────────────────────────────────────────────────

export async function handleUnmarkNodeList(nodeIds: string[]): Promise<void> {
	const idSet = new Set(nodeIds);
	const tabs = getStoredTabs();

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

	saveTabs(updatedTabs);

	// Send TAB_UPDATED for each affected tab (or remove it if now empty)
	for (const original of tabs) {
		const updated = updatedTabs.find(t => t.id === original.id);
		if (updated) sendToUI({ type: "TAB_UPDATED", tab: updated });
		// Removed tabs: UI handles that via unmarkNodes optimistic update
	}
}


// ─── Select / highlight ───────────────────────────────────────────────────────

export async function handleHighlightMarked(): Promise<void> {
	const tabs = getStoredTabs();
	const allNodeIds = tabs.flatMap(t => [
		...t.nodes.map(n => n.id),
		...t.sections.flatMap(s => s.nodes.map(n => n.id)),
	]);

	const nodes = await Promise.all(allNodeIds.map(id => figma.getNodeByIdAsync(id)));
	const validNodes = nodes.filter((n): n is SceneNode => n !== null && "parent" in n && n.parent !== null);

	if (validNodes.length === 0) { sendError("No marked layers found in this file."); return; }
	figma.currentPage.selection = validNodes;
	figma.viewport.scrollAndZoomIntoView(validNodes);
	sendNotify(`Highlighted ${validNodes.length} marked layer${validNodes.length !== 1 ? "s" : ""}.`);
}

export async function handleSelectNode(nodeId: string): Promise<void> {
	const node = await figma.getNodeByIdAsync(nodeId);
	if (!node) { sendError("Layer no longer exists in this file."); return; }
	if (!("parent" in node) || node.parent === null) { sendError("Cannot select this node."); return; }
	figma.currentPage.selection = [node as SceneNode];
	figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
}

export async function handleSyncSelectionToUI(): Promise<void> {

	const tabs = getStoredTabs();
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

export async function handleClearAll(): Promise<void> {
	saveTabs([]);
}


// ─── Section handlers ─────────────────────────────────────────────────────────

export async function handleCreateSection(name: string, sectionId: string, tabId: string): Promise<void> {
	const tabs = getStoredTabs();
	const tab = tabs.find(t => t.id === tabId);
	if (!tab) return;

	const newSection: NodeSection = { id: sectionId, name, nodes: [], topFrameId: tabId };
	const updated: FrameTab = {
		...tab,
		sections: [...tab.sections, newSection],
		itemOrder: [...tab.itemOrder, sectionId],
	};
	saveTab(updated);
	// Already handled optimistically client-side
}

export async function handleDeleteSection(sectionId: string, tabId: string): Promise<void> {
	const tabs = getStoredTabs();
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
	saveTab(updated);
	// Already handled optimistically client-side
}

export async function handleRenameSection(sectionId: string, name: string): Promise<void> {
	const tabs = getStoredTabs();
	const tab = tabs.find(t => t.sections.some(s => s.id === sectionId));
	if (!tab) return;

	const updated: FrameTab = {
		...tab,
		sections: tab.sections.map(s => s.id === sectionId ? { ...s, name } : s),
	};
	saveTab(updated);
	// Already handled optimistically client-side
}

export async function handleReorderItems(tabId: string, itemIds: string[]): Promise<void> {
	const tabs = getStoredTabs();
	const tab = tabs.find(t => t.id === tabId);
	if (!tab) return;

	saveTab({ ...tab, itemOrder: itemIds });
	// Already handled optimistically client-side
}

export async function handleMoveNodeListToSection(
	nodeIds: string[],
	sectionId: string | null,
	index: number
): Promise<void> {
	const idSet = new Set(nodeIds);
	const tabs = getStoredTabs();

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

	saveTab(updated);
	// Already handled optimistically client-side
}

export async function handleReorderNodesInSection(sectionId: string, nodeIds: string[]): Promise<void> {
	const tabs = getStoredTabs();
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
	saveTab(updated);
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
