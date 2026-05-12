import { ChildTextNode, MarkedNode } from "@ctypes/messages";
import { sendToUI } from "./message";
import { getStoredIds, saveIds } from "./storage";

export async function loadAndSendMarkedNodes(): Promise<void> {
	const storedIds = await getStoredIds();
	const validIds: string[] = [];
	const markedNodes: MarkedNode[] = [];

	for (const id of storedIds) {
		const node = await figma.getNodeByIdAsync(id);
		if (!node) continue; // Node deleted from file — skip silently
		validIds.push(id);
		resolveNode(node).forEach(child => markedNodes.push(child));
	}

	// Prune deleted nodes from storage
	if (validIds.length !== storedIds.length) {
		await saveIds(validIds);
	}

	sendToUI({ type: "MARKED_NODES_UPDATE", nodes: markedNodes });
}

export function resolveNode(node: BaseNode): MarkedNode[] {
	if (node.type === "TEXT") {
		return [{
			id: node.id,
			name: node.name,
			nodeType: node.type,
			previewText: node.characters,
		}];
	}

	// Non-text: recurse into children to collect text nodes
	const childTextNodes = collectTextChildren(node);

	return childTextNodes.map<MarkedNode>(child => ({
		id: child.id,
		name: child.name,
		nodeType: node.type,
		previewText: child.content,
	}));
}

export function collectTextChildren(node: BaseNode): ChildTextNode[] {
	const results: ChildTextNode[] = [];

	if (node.type === "TEXT") {
		results.push({ id: node.id, name: node.name, content: node.characters });
		return results;
	}

	if ("children" in node) {
		for (const child of node.children) {
			results.push(...collectTextChildren(child));
		}
	}

	return results;
}
