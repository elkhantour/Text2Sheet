import React from "react";
import { useState, useCallback, useEffect, useContext, createContext } from "react";
import { usePlugin } from "@contexts/usePlugin";

export interface NodeSelectionState {
	selectedIds: Set<string>;
	select: (id: string) => void;
	toggle: (id: string) => void;
	deselect: (id: string) => void;
	rangeSelect: (id: string, orderedIds: string[]) => void;
	clearSelection: () => void;
	isSelected: (id: string) => boolean;
	toggleLinkSelection: () => void;
	isLinkSelection: boolean;
}

const NodeSelectionContext = createContext<NodeSelectionState | null>(null);

export function NodeSelectionProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
	const [isLinkSelection, setIsLinkSelection] = useState<boolean>(false);

	const { getNodeFromId, getSectionFromId, setActiveTab, activeTab } = usePlugin();

	useEffect(() => {
		const handler = (event: MessageEvent) => {
			const msg = event.data.pluginMessage;

			switch (msg.type) {
				case "SELECT_NODES":

					if (msg.nodes.length > 0) {
						const node = getNodeFromId(msg.nodeIds[0]);

						if (node) {
							setActiveTab(node.topFrameId);
						}
					}

					// FIXME: msg.nodesId
					setSelectedIds(new Set(msg.nodes));
					break;
			}
		};

		if (isLinkSelection) {
			window.addEventListener("message", handler);
		}

		return () => {
			window.removeEventListener("message", handler);
		};

	}, [getNodeFromId, isLinkSelection]);

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

	const deselect = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
	}, []);

	const rangeSelect = useCallback((id: string, orderedIds: string[]) => {

		if (!activeTab) { return; }
		if (!lastSelectedId) { select(id); return; }

		// flatten the ordered ids
		const flattenOrdered: string[] = [];

		orderedIds.forEach(id => {
			const section = getSectionFromId(activeTab.id, id);
			if (section) {
				flattenOrdered.push(...section.nodes.map(n => n.id));
			} else {
				flattenOrdered.push(id);
			}
		});

		const fromIdx = flattenOrdered.indexOf(lastSelectedId);
		const toIdx = flattenOrdered.indexOf(id);

		if (fromIdx === -1 || toIdx === -1) { select(id); return; }

		const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
		const rangeIds = flattenOrdered.slice(start, end + 1);

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

	const toggleLinkSelection = useCallback(() => {
		setIsLinkSelection(!isLinkSelection);
	}, [isLinkSelection]);

	return (<NodeSelectionContext.Provider value={{
		selectedIds,
		select,
		deselect,
		toggle,
		rangeSelect,
		clearSelection,
		isSelected,
		toggleLinkSelection,
		isLinkSelection,
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
