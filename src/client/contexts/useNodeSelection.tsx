import React from "react";
import { useState, useCallback, useEffect, useContext, createContext } from "react";
import { useTabs } from "./useTabs";
import { usePlugin } from "@hooks/usePlugin";

export interface NodeSelectionState {
	selectedIds: Set<string>;
	select: (id: string) => void;
	toggle: (id: string) => void;
	rangeSelect: (id: string, orderedIds: string[]) => void;
	clearSelection: () => void;
	isSelected: (id: string) => boolean;
}

const NodeSelectionContext = createContext<NodeSelectionState | null>(null);

export function NodeSelectionProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

	const { getNodeFromId } = usePlugin();
	const { activeTabId, setActiveTabId } = useTabs();

	// DELETEME
	//useEffect(() => {
	//	clearSelection();
	//}, [activeTabId]);


	useEffect(() => {
		const handler = (event: MessageEvent) => {
			const msg = event.data.pluginMessage;

			switch (msg.type) {
				case "SELECT_NODES":

					if (msg.nodeIds.length > 0) {
						const node = getNodeFromId(msg.nodeIds[0]);

						if (node) {
							setActiveTabId(node.topFrameId);
						}
					}

					setSelectedIds(new Set(msg.nodeIds));
					break;
			}
		};

		window.addEventListener("message", handler);

		return () => {
			window.removeEventListener("message", handler);
		};
	}, [getNodeFromId]);

	const select = useCallback((id: string) => {
		setSelectedIds(new Set([id]));
		setLastSelectedId(id);
	}, []);

	const toggle = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
		setLastSelectedId(id);
	}, []);

	const rangeSelect = useCallback((id: string, orderedIds: string[]) => {
		if (!lastSelectedId) { select(id); return; }

		const fromIdx = orderedIds.indexOf(lastSelectedId);
		const toIdx = orderedIds.indexOf(id);

		if (fromIdx === -1 || toIdx === -1) { select(id); return; }

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

	return (<NodeSelectionContext.Provider value={{
		selectedIds,
		select,
		toggle,
		rangeSelect,
		clearSelection,
		isSelected
	}}>
		{children}
	</NodeSelectionContext.Provider>
	);
}

export function useNodeSelection(): NodeSelectionState {
	const ctx = useContext(NodeSelectionContext);
	if (!ctx) throw new Error("useNodeSelection must be used within a NodeSelectionProvider");
	return ctx;
}
