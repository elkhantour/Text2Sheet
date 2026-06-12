import { PLUGIN_HEIGHT, PLUGIN_WIDTH } from "./constants";
import { sendError, sendNotify, sendToUI } from "./message";
import { loadAndSendState } from "./node";
import { getStoredIds, saveIds, getSections, saveSections, saveItemOrder, saveExportOptions, getItemOrder, saveSelectionOptions, getSelectionOptions } from "./storage";
import { ExportOptions, SelectionOptions } from "@ctypes/messages";

// ─── Existing handlers ────────────────────────────────────────────────────────

export async function handleHighlightMarked(): Promise<void> {
	const storedIds = getStoredIds();
	const nodes = await Promise.all(storedIds.map((id) => figma.getNodeByIdAsync(id)));
	const validNodes = nodes.filter((n): n is SceneNode => n !== null && "parent" in n && n.parent !== null);
	if (validNodes.length === 0) { sendError("No marked layers found in this file."); return; }
	figma.currentPage.selection = validNodes;
	figma.viewport.scrollAndZoomIntoView(validNodes);
	sendNotify(`Highlighted ${validNodes.length} marked layer${validNodes.length !== 1 ? "s" : ""}.`);
}

export async function handleMarkSelection(): Promise<void> {

	// DEBUG
	let characterCount = 0, layerCount = 0;
	const debugStart = Date.now();

	const selection = figma.currentPage.selection;
	if (selection.length === 0) { sendError("Select at least one layer in the canvas first."); return; }
	const storedIds = getStoredIds();
	const itemOrder = getItemOrder();
	const sections = getSections();
	const { autogroup } = getSelectionOptions();
	const selectionTextNodeIds: string[] = [];

	// Collects all visible TEXT node ids nested anywhere under `node`.
	const collectTextNodes = (node: SceneNode, out: string[]) => {
		if (node.type === "TEXT") {
			if (node.visible) out.push(node.id);
			return;
		}
		if (!node.visible) return;
		if (!("findAllWithCriteria" in node)) return;

		const textNodes = node.findAllWithCriteria({ types: ["TEXT"] });
		for (const t of textNodes) {
			if (t.visible) out.push(t.id);
		}
	};

	// A "first layer" container that should become its own section.
	const isSectionable = (node: SceneNode): boolean =>
		node.type === "GROUP" || node.type === "FRAME";

	const traversalStart = Date.now(); // DEBUG

	if (autogroup) {
		for (const sel of selection) {
			if (!("children" in sel)) {
				collectTextNodes(sel, selectionTextNodeIds);
				continue;
			}
			for (const child of sel.children) {
				if (!child.visible) continue;
				if (child.type === "TEXT") {
					selectionTextNodeIds.push(child.id);
					layerCount++; // DEBUG
					characterCount += child.characters.length; // DEBUG
					continue;
				}
				if (isSectionable(child)) {
					const groupTextIds: string[] = [];
					collectTextNodes(child, groupTextIds);
					if (groupTextIds.length === 0) continue;
					selectionTextNodeIds.push(...groupTextIds);
					const existingSection = sections.find((s) => s.id === child.id);
					if (existingSection) {
						const existingIds = new Set(existingSection.nodeIds);
						for (const id of groupTextIds) {
							if (!existingIds.has(id)) {
								existingSection.nodeIds.push(id);
								existingIds.add(id);
							}
						}
						existingSection.name = child.name;
					} else {
						sections.push({
							id: child.id,
							name: child.name,
							nodeIds: groupTextIds,
							topFrameId: sel.id,
							topFrameName: sel.name,
						});
						if (!itemOrder.includes(child.id)) itemOrder.push(child.id);
					}
				} else {
					collectTextNodes(child, selectionTextNodeIds);
				}
			}
		}
	} else {
		selection.forEach((sel) => collectTextNodes(sel, selectionTextNodeIds));
	}

	const traversalEnd = Date.now(); // DEBUG

	// Any text id that now belongs to a section shouldn't also live in the root item order.
	const sectionedIds = new Set(sections.flatMap((s) => s.nodeIds));
	const cleanedItemOrder = itemOrder.filter((id) => !sectionedIds.has(id));
	for (const id of selectionTextNodeIds) {
		if (!storedIds.includes(id)) storedIds.push(id);
		if (!sectionedIds.has(id) && !cleanedItemOrder.includes(id)) {
			cleanedItemOrder.push(id);
		}
	}

	const mergeEnd = Date.now(); // DEBUG

	sendToUI({ type: "LATEST_ADDED_NODES", nodeIds: selectionTextNodeIds });

	saveIds(storedIds);
	saveSections(sections);
	saveItemOrder(cleanedItemOrder);

	const loadAndSend = Date.now(); // DEBUG

	await loadAndSendState();

	const totalEnd = Date.now(); // DEBUG

	// DEBUG
	console.log(
		`[markSelection debug] layers visited: ${layerCount}\n ` +
		`text nodes marked: ${selectionTextNodeIds.length}\n ` +
		`characters: ${characterCount}\n ` +
		`storedIds: ${storedIds.length}, itemOrder: ${cleanedItemOrder.length}, sections: ${sections.length}\n ` +
		`traversal: ${traversalEnd - traversalStart}ms\n ` +
		`merge: ${mergeEnd - traversalEnd}ms\n ` +
		`save: ${loadAndSend - mergeEnd}ms\n ` +
		`loadState: ${totalEnd - loadAndSend}ms\n ` +
		`total: ${totalEnd - debugStart}ms`
	);

	sendNotify(`Marked ${selectionTextNodeIds.length} layer${selectionTextNodeIds.length > 1 ? "s" : ""} for export.`);
}

export async function handleUnmarkNodeList(nodeIds: string[]): Promise<void> {
	const [storedIds, sections, itemOrder] = await Promise.all([
		getStoredIds(),
		getSections(),
		getItemOrder(),
	]);

	const idSet = new Set(nodeIds);

	await Promise.all([
		saveIds(storedIds.filter(id => !idSet.has(id))),
		saveSections(
			sections.map(s => ({
				...s,
				nodeIds: s.nodeIds.filter(id => !idSet.has(id)),
			}))
		),
		saveItemOrder(itemOrder.filter(id => !idSet.has(id))),
	]);

	// Already handled visually client side
	// await loadAndSendState();
}

export async function handleSelectNode(nodeId: string): Promise<void> {
	const node = await figma.getNodeByIdAsync(nodeId);
	if (!node) { sendError("Layer no longer exists in this file."); return; }
	if (!("parent" in node) || node.parent === null) { sendError("Cannot select this node."); return; }
	figma.currentPage.selection = [node as SceneNode];
	figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
}

export function handleReorder(nodeIds: string[]): void {
	saveIds(nodeIds);
}

// ─── Section handlers ─────────────────────────────────────────────────────────

export async function handleCreateSection(name: string, sectionId: string, topFrameId: string, topFrameName: string): Promise<void> {
	const itemOrder = getItemOrder();
	const sections = getSections();
	const newSection = { id: sectionId, name, nodeIds: [] as string[], topFrameId, topFrameName };
	saveSections([...sections, newSection]);
	saveItemOrder([...itemOrder, newSection.id]);

	// Already handled visually client side
	// await loadAndSendState();
}

export async function handleDeleteSection(sectionId: string): Promise<void> {
	const [sections, itemOrder] = await Promise.all([getSections(), getItemOrder()]);
	const target = sections.find((s) => s.id === sectionId);
	if (!target) return;
	const sectionIdx = itemOrder.indexOf(sectionId);
	const newOrder = [...itemOrder];
	newOrder.splice(sectionIdx, 1, ...target.nodeIds);
	saveSections(sections.filter((s) => s.id !== sectionId));
	saveItemOrder(newOrder);

	// Already handled visually client side
	// await loadAndSendState();
}

export async function handleRenameSection(sectionId: string, name: string): Promise<void> {
	const sections = getSections();
	saveSections(sections.map((s) => (s.id === sectionId ? { ...s, name } : s)));

	// Already handled visually client side
	// await loadAndSendState();
}

export async function handleReorderItems(itemIds: string[]): Promise<void> {
	saveItemOrder(itemIds);

	// Already handled visually client side
	// await loadAndSendState();
}

export async function handleMoveNodeListToSection(
	nodeIds: string[],
	sectionId: string | null,
	index: number
): Promise<void> {

	const sections = getSections();
	const itemOrder = getItemOrder();

	const idSet = new Set(nodeIds);

	// remove all nodes from current locations
	const cleanedSections = sections.map((s) => ({
		...s,
		nodeIds: s.nodeIds.filter((id) => !idSet.has(id)),
	}));

	const cleanedOrder = itemOrder.filter((id) => !idSet.has(id));

	if (sectionId === null) {
		// insert into root order
		cleanedOrder.splice(index, 0, ...nodeIds);

		await Promise.all([
			saveSections(cleanedSections),
			saveItemOrder(cleanedOrder),
		]);
	} else {
		const target = cleanedSections.find((s) => s.id === sectionId);
		if (!target) return;

		// insert into section
		target.nodeIds.splice(index, 0, ...nodeIds);

		await Promise.all([
			saveSections(cleanedSections),
			saveItemOrder(cleanedOrder),
		]);
	}

	// TODO: Already handled visually client side
	// await loadAndSendState();
}

export async function handleReorderNodesInSection(sectionId: string, nodeIds: string[]): Promise<void> {
	const sections = getSections();
	saveSections(sections.map((s) => (s.id === sectionId ? { ...s, nodeIds } : s)));

	//TODO:  Already handled visually client side
	await loadAndSendState();
}

export async function handleSaveExportOptions(options: ExportOptions): Promise<void> {
	saveExportOptions(options);
	await loadAndSendState();
}

export async function handleSaveSelectionOptions(options: SelectionOptions): Promise<void> {
	saveSelectionOptions(options);
	await loadAndSendState();
}

export async function handleSyncSelectionToUI() {
	const storedIds = new Set(getStoredIds());

	const selectedStoredIds: string[] = [];

	function visit(node: SceneNode) {
		if (storedIds.has(node.id)) {
			selectedStoredIds.push(node.id);
		}

		if ("children" in node) {
			for (const child of node.children) {
				visit(child);
			}
		}
	}

	for (const node of figma.currentPage.selection) {
		visit(node);
	}

	sendToUI({ type: "SELECT_NODES", nodeIds: selectedStoredIds });
}


export function handleResizeWindow(width: number, height: number) {
	width = Math.max(Math.round(width), PLUGIN_WIDTH);
	height = Math.max(Math.round(height), PLUGIN_HEIGHT);
	figma.ui.resize(width, height);
}
