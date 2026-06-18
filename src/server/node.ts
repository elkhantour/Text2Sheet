import type { ChildTextNode, FrameTab, GlobalStats, MarkedNode, NodeSection, TreeNode } from "@ctypes/messages";
import { sendToUI } from "./message";
import {
	getStoredTabs,
	saveTabs,
	getExportOptions,
	getSelectionOptions,
} from "./storage";
import { ORPHAN_TAB_ID, ORPHAN_TAB_NAME } from "../lib/constants";


// ─── Main state loader ────────────────────────────────────────────────────────

export async function loadAndSendState(): Promise<void> {

	const startTime = Date.now();

	const storedTabs = getStoredTabs();
	const exportOptions = getExportOptions();
	const selectionOptions = getSelectionOptions();
	const tree = getTreeFromTabs(storedTabs);
	const globalStats = computeGlobalStats(storedTabs);

	sendToUI({
		type: "STATE_UPDATE",
		tree,
		exportOptions,
		selectionOptions,
		globalStats
	});

	const finalTime = Date.now() - startTime;
	console.log(`Loaded in ${finalTime}ms`);
}

export async function loadAndSendMarkedNodes(): Promise<void> {
	return loadAndSendState();
}

export function computeGlobalStats(tabs: FrameTab[]): GlobalStats {
	return {
		pagesCount: tabs.length,
		rowsCount: tabs.reduce((acc, tab) =>
			acc
			+ tab.nodes.length
			+ tab.sections.reduce((bcc, sec) => bcc + sec.nodes.length, 0),
			0),
	};
}


// ─── Tab resolution ───────────────────────────────────────────────────────────

/**
	* Takes stored FrameTab shells, resolves all node IDs through the Figma API,
	* and returns fully populated FrameTabs with embedded MarkedNode objects.
	* Prunes any node IDs that no longer exist in the Figma document.
	*/
export async function resolveTabs(storedTabs: FrameTab[]): Promise<FrameTab[]> {
	const resolved = await Promise.all(storedTabs.map(resolveTab));

	// Drop any tabs that ended up completely empty after pruning
	const nonEmpty = resolved.filter(
		t => t.nodes.length > 0 || t.sections.some(s => s.nodes.length > 0)
	);

	// Persist back if anything was pruned
	if (nonEmpty.length !== storedTabs.length) saveTabs(nonEmpty);

	return nonEmpty;
}

export async function resolveTab(tab: FrameTab): Promise<FrameTab> {
	// Resolve orphan nodes
	const resolvedNodes = await resolveNodeList(tab.nodes.map(n => n.id));

	// Resolve each section's nodes
	const resolvedSections: NodeSection[] = await Promise.all(
		tab.sections.map(async (section) => {
			const nodes = await resolveNodeList(section.nodes.map(n => n.id));
			return { ...section, nodes };
		})
	);

	// Prune itemOrder to only IDs that still exist
	const validIds = new Set([
		...resolvedNodes.map(n => n.id),
		...resolvedSections.map(s => s.id),
	]);
	const itemOrder = tab.itemOrder.filter(id => validIds.has(id));

	return { ...tab, nodes: resolvedNodes, sections: resolvedSections, itemOrder };
}

/**
	* Resolves a list of node IDs into MarkedNode objects.
	* Silently drops IDs that no longer exist in the Figma document.
	*/
async function resolveNodeList(nodeIds: string[]): Promise<MarkedNode[]> {
	const results = await Promise.all(
		nodeIds.map(async (id) => {
			const figmaNode = await figma.getNodeByIdAsync(id);
			if (!figmaNode) return null;
			return resolveNode(figmaNode);
		})
	);
	// resolveNode may return multiple nodes (e.g. text children), flatten and drop nulls
	return results.filter((r): r is MarkedNode => r !== null);
}


// ─── Node resolution ──────────────────────────────────────────────────────────

export function resolveNode(node: BaseNode): MarkedNode {
	const { id: topFrameId } = getTopFrame(node);

	if (node.type === "TEXT") {
		return {
			id: node.id,
			name: node.name,
			nodeType: node.type,
			previewText: node.characters,
			topFrameId,
		};
	}

	// For non-text nodes, use the first text child as preview
	const firstChild = collectTextChildren(node)[0];
	return {
		id: node.id,
		name: node.name,
		nodeType: node.type,
		previewText: firstChild?.content ?? "",
		childTextNodes: collectTextChildren(node),
		topFrameId,
	};
}

export function getTopFrame(node: BaseNode): { id: string; name: string } {
	let current: BaseNode = node;
	while (current.parent && current.parent.type !== "PAGE" && current.parent.type !== "DOCUMENT") {
		current = current.parent;
	}

	const isOrphan = current.type !== "FRAME" && current.type !== "COMPONENT" && current.type !== "SECTION";
	if (isOrphan) return { id: ORPHAN_TAB_ID, name: ORPHAN_TAB_NAME };

	return { id: current.id, name: current.name };
}

export function collectTextChildren(node: BaseNode): ChildTextNode[] {
	const results: ChildTextNode[] = [];
	if (node.type === "TEXT") {
		results.push({ id: node.id, name: node.name, content: node.characters });
		return results;
	}
	if ("children" in node) {
		for (const child of node.children) results.push(...collectTextChildren(child));
	}
	return results;
}


export function getTreeFromTabs(tabs: FrameTab[]): TreeNode[] {
	const root: TreeNode[] = [];

	for (const tab of tabs) {
		const pathSegments = tab.name.split('/').filter(Boolean);
		let currentLevel = root;
		let targetNode: TreeNode | null = null;

		for (let i = 0; i < pathSegments.length; i++) {
			const segment = pathSegments[i];
			const isLastSegment = i === pathSegments.length - 1;
			const existingNode = currentLevel.find(node => node.name === segment);

			if (existingNode) {
				currentLevel = existingNode.children || (existingNode.children = []);
				targetNode = existingNode;
			} else {
				const newNode: TreeNode = {
					id: isLastSegment ? tab.id : `${tab.id}-${i}`,
					name: segment,
					children: [],
				};
				currentLevel.push(newNode);
				currentLevel = newNode.children!;
				targetNode = newNode;
			}
		}

		// Attach tab to the last node in the path
		if (targetNode) {
			targetNode.tab = tab;
		}
	}

	return root;
}
