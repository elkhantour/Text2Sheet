import type { ChildTextNode, MarkedNode } from "@ctypes/messages";
import { sendToUI } from "./message";
import {
	getStoredIds,
	saveIds,
	getSections,
	getItemOrder,
	getExportOptions,
	getCachedNodesArray
} from "./storage";
import { ORPHAN_TAB_ID, ORPHAN_TAB_NAME } from "../lib/constants";

// ─── Main state loader ────────────────────────────────────────────────────────


export async function loadAndSendState(): Promise<void> {
	const storedIds = getStoredIds();
	const sections = getSections();
	const itemOrder = getItemOrder();
	const exportOptions = getExportOptions();

	const cachedNodes = getCachedNodesArray();
	const validIds: string[] = cachedNodes.map(n => n.id);

	if (validIds.length !== storedIds.length) saveIds(validIds);

	const validIdSet = new Set(validIds);
	const cleanedSections = sections.map((s) => ({
		...s,
		nodeIds: s.nodeIds.filter((id) => validIdSet.has(id)),
	}));

	const sectionIdSet = new Set(cleanedSections.map((s) => s.id));
	const cleanedOrder = itemOrder.filter((id) => validIdSet.has(id) || sectionIdSet.has(id));

	const idsInSections = new Set(cleanedSections.flatMap((s) => s.nodeIds));
	const cleanedOrderSet = new Set(cleanedOrder);
	for (const id of validIds) {
		if (!cleanedOrderSet.has(id) && !idsInSections.has(id)) {
			cleanedOrder.push(id);
			cleanedOrderSet.add(id);
		}
	}

	console.log(cleanedOrder);

	sendToUI({
		type: "STATE_UPDATE",
		nodes: cachedNodes,
		sections: cleanedSections,
		itemOrder: cleanedOrder,
		exportOptions
	});
}

export async function loadAndSendMarkedNodes(): Promise<void> {
	return loadAndSendState();
}

// ─── Node resolution ──────────────────────────────────────────────────────────

export function resolveNode(node: BaseNode): MarkedNode[] {
	const { id: topFrameId, name: topFrameName } = getTopFrame(node);

	if (node.type === "TEXT") {
		return [{
			id: node.id,
			name: node.name,
			nodeType: node.type,
			previewText: node.characters,
			topFrameId,
			topFrameName
		}];
	}

	const childTextNodes = collectTextChildren(node);
	return childTextNodes.map<MarkedNode>((child) => ({
		id: child.id,
		name: child.name,
		nodeType: node.type,
		previewText: child.content,
		topFrameId, topFrameName,
	}));
}

export function getTopFrame(node: BaseNode): { id: string; name: string } {
	let current: BaseNode = node;
	while (current.parent && current.parent.type !== "PAGE" && current.parent.type !== "DOCUMENT") {
		current = current.parent;
	}

	const isOrphan = current.type !== "FRAME" && current.type !== "COMPONENT" && current.type !== "SECTION";
	if (isOrphan) {
		return { id: ORPHAN_TAB_ID, name: ORPHAN_TAB_NAME };
	}

	return { id: current.id, name: current.name };
}

export function collectTextChildren(node: BaseNode): ChildTextNode[] {
	const results: ChildTextNode[] = [];
	if (node.type === "TEXT") {
		results.push({
			id: node.id,
			name: node.name,
			content: node.characters
		});
		return results;
	}
	if ("children" in node) {
		for (const child of node.children) results.push(...collectTextChildren(child));
	}
	return results;
}
