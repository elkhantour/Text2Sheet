import { sendError, sendNotify } from "./message";
import { loadAndSendMarkedNodes } from "./node";
import { getStoredIds, saveIds } from "./storage";

export async function handleHighlightMarked(): Promise<void> {
	const storedIds = await getStoredIds();
	const nodes = await Promise.all(storedIds.map((id) => figma.getNodeByIdAsync(id)));
	nodes.filter((n): n is SceneNode => n !== null && "parent" in n && n.parent !== null);

	if (!nodes || nodes.length === 0) {
		sendError("No marked layers found in this file.");
		return;
	}

	figma.currentPage.selection = nodes as SceneNode[];
	figma.viewport.scrollAndZoomIntoView(nodes as SceneNode[]);
	sendNotify(`Highlighted ${nodes.length} marked layer${nodes.length !== 1 ? "s" : ""}.`);
}

export async function handleMarkSelection(): Promise<void> {
	const selection = figma.currentPage.selection;

	if (selection.length === 0) {
		sendError("Select at least one layer in the canvas first.");
		return;
	}

	const storedIds = await getStoredIds();

	const selectionTextNodesIDs: string[] = [];

	const getChildTextNodes = (node: SceneNode) => {

		if (node.type == "TEXT")
			return selectionTextNodesIDs.push(node.id);

		if ("children" in node)
			for (const child of node.children)
				getChildTextNodes(child);

	};
	selection.forEach(sel => getChildTextNodes(sel));

	for (const id of selectionTextNodesIDs)
		if (!storedIds.includes(id))
			storedIds.push(id);


	await saveIds(storedIds);
	await loadAndSendMarkedNodes();
	sendNotify(`Marked ${selectionTextNodesIDs.length} layer${selectionTextNodesIDs.length > 1 ? "s" : ""} for export.`);
}

export async function handleUnmarkNode(nodeId: string): Promise<void> {
	const storedIds = await getStoredIds();
	const updated = storedIds.filter((id) => id !== nodeId);
	await saveIds(updated);
	await loadAndSendMarkedNodes();
}

export async function handleSelectNode(nodeId: string): Promise<void> {
	const node = await figma.getNodeByIdAsync(nodeId);
	if (!node) {
		sendError("Layer no longer exists in this file.");
		return;
	}
	if (!("parent" in node) || node.parent === null) {
		sendError("Cannot select this node.");
		return;
	}
	figma.currentPage.selection = [node as SceneNode];
	figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
}

export async function handleReorder(nodeIds: string[]): Promise<void> {
	await saveIds(nodeIds);
	// No need to re-resolve; UI already knows the order
}
