
export function reorderTopLevel(order: string[], dragId: string, beforeId: string | null): string[] {
	const without = order.filter((id) => id !== dragId);
	if (beforeId === null) return [...without, dragId];
	const idx = without.indexOf(beforeId);
	if (idx === -1) return [...without, dragId];
	const next = [...without];
	next.splice(idx, 0, dragId);
	return next;
}

// TODO: clean
export function removeNodeFromSource(
	tabId: string,
	nodeId: string,
	sourceSectionId: string | null,
	itemOrder: string[],
	onMoveNodeToSection: (nodeIds: string[], sectionId: string | null, index: number) => void,
	onReorderNodesInSection: (sectionId: string, nodeIds: string[]) => void,
	onReorderItems: (tabId: string, itemIds: string[]) => void,
) {
	if (sourceSectionId === null) {
		// Was a loose top-level node — remove from itemOrder
		onReorderItems(tabId, itemOrder.filter((id) => id !== nodeId));
	}
	// If it was inside a section the plugin handles removal when it receives MOVE_NODE_TO_SECTION
}

