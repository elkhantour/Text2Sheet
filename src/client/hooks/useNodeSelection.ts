import { useState, useCallback, useEffect } from "react";

export interface NodeSelectionState {
	selectedIds: Set<string>;
	select: (id: string) => void;
	toggle: (id: string) => void;
	rangeSelect: (id: string, orderedIds: string[]) => void;
	clearSelection: () => void;
	isSelected: (id: string) => boolean;
	contextMenu: {
		isOpen: boolean;
		position: { x: number; y: number } | undefined;
		open: (event: React.MouseEvent) => void,
		close: () => void;
	}
}

export function useNodeSelection(activeTabId: string | null): NodeSelectionState {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
	const [openContextMenu, setOpenContextMenu] = useState<boolean>(false);

	// Clear selection on tab change
	useEffect(() => {
		setSelectedIds(new Set());
		setLastSelectedId(null);
	}, [activeTabId]);

	const select = useCallback((id: string) => {
		setSelectedIds(new Set([id]));
		setLastSelectedId(id);
	}, []);

	const toggle = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
		setLastSelectedId(id);
	}, []);

	const rangeSelect = useCallback((id: string, orderedIds: string[]) => {
		if (!lastSelectedId) {
			select(id);
			return;
		}

		const fromIdx = orderedIds.indexOf(lastSelectedId);
		const toIdx = orderedIds.indexOf(id);

		if (fromIdx === -1 || toIdx === -1) {
			select(id);
			return;
		}

		const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
		const rangeIds = orderedIds.slice(start, end + 1);

		setSelectedIds((prev) => {
			const next = new Set(prev);
			for (const rid of rangeIds) next.add(rid);
			return next;
		});
	}, [lastSelectedId, select]);

	const clearSelection = useCallback(() => {
		setSelectedIds(new Set());
		setLastSelectedId(null);
	}, []);

	const isSelected = useCallback(
		(id: string) => selectedIds.has(id),
		[selectedIds],
	);

	const contextMenu = {
		isOpen: openContextMenu,
		position: { x: 0, y: 0 },
		open: useCallback((e: React.MouseEvent) => {
			setOpenContextMenu(true);
			contextMenu.position = { x: e.clientX, y: e.clientY };
		}, []),
		close: useCallback(() => {
			setOpenContextMenu(false);
		}, [openContextMenu]),
	};

	return {
		selectedIds,
		select,
		toggle,
		rangeSelect,
		clearSelection,
		isSelected,
		contextMenu,
	};
}
