
export function reorderTopLevel(order: string[], dragId: string, beforeId: string | null): string[] {
	const without = order.filter((id) => id !== dragId);
	if (beforeId === null) return [...without, dragId];
	const idx = without.indexOf(beforeId);
	if (idx === -1) return [...without, dragId];
	const next = [...without];
	next.splice(idx, 0, dragId);
	return next;
}

export function removeNodeFromSource(
	nodeId: string,
	sourceSectionId: string | null,
	itemOrder: string[],
	onMoveNodeToSection: (nodeId: string, sectionId: string | null, index: number) => void,
	onReorderNodesInSection: (sectionId: string, nodeIds: string[]) => void,
	onReorderItems: (itemIds: string[]) => void,
) {
	if (sourceSectionId === null) {
		// Was a loose top-level node — remove from itemOrder
		onReorderItems(itemOrder.filter((id) => id !== nodeId));
	}
	// If it was inside a section the plugin handles removal when it receives MOVE_NODE_TO_SECTION
}

