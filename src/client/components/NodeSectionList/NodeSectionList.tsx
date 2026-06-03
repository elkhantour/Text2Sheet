import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { DragItem, DropZone } from "@components/Dnd/Context";
import { DndContext } from "@components/Dnd/Context";
import { NodeSectionItem } from "@components/NodeSectionItem/NodeSectionItem";
import { NodeCard } from "@components/NodeCard/NodeCard";
import { DropIndicator } from "@components/Dnd/DropIndicator";
import { EmptyState } from "./EmptyState";
import { removeNodeFromSource, reorderTopLevel } from "./Helpers";
import { Button, Text } from "@radix-ui/themes";
import { PlusIcon } from "lucide-react";
import { ICON_SIZE_SMALL } from "@utils/constants";
import { useNodeSelection } from "@contexts/useNodeSelection";
import { usePlugin } from "@hooks/usePlugin";
import { useTabs } from "@contexts/useTabs";


export function NodeSectionList(): React.ReactElement {

	const {
		createSection,
		deleteSection,
		renameSection,
		reorderItems,
		moveNodesToSection,
		reorderNodesInSection,
		getNodeFromId,
		getSectionFromId,
		sections,
	} = usePlugin();

	const { activeTab, activeNodes, activeSections, activeItemOrder } = useTabs();


	const bodyRef = useRef<HTMLDivElement | null>(null);
	const lastSectionCount = useRef<number>(0);
	const lastTabId = useRef<string | null>(activeTab ? activeTab.id : null);

	const [dragging, setDragging] = useState<DragItem | null>(null);
	const [activeDropZone, setActiveDropZone] = useState<DropZone | null>(null);

	// ── Selection ─────────────────────────────────────────────────────────────
	const selection = useNodeSelection();

	// DELETEME Flat ordered list of all visible node IDs for range-select
	const orderedNodeIds = useMemo(() => {
		const ids: string[] = [];
		for (const id of activeItemOrder) {

			const node = getNodeFromId(id);
			if (node) {
				ids.push(id);
			} else {
				const section = getSectionFromId(id);
				if (section) ids.push(...section.nodeIds.filter((nid) => !!(getNodeFromId(nid))));
			}
		}
		return ids;
	}, [activeItemOrder, activeNodes, activeSections]);


	// TODO: Move this whole chunk within a DragAndDrop decicated component
	// ── Dnd ───────────────────────────────────────────────────────────────────

	const startDrag = useCallback((item: DragItem) => setDragging(item), []);
	const setDropZone = useCallback((zone: DropZone | null) => setActiveDropZone(zone), []);

	const endDrag = useCallback(() => {
		if (!dragging || !activeDropZone) {
			setDragging(null);
			setActiveDropZone(null);
			return;
		}

		if (dragging.kind === "section") {
			if (activeDropZone.kind === "top-level") {
				const next = reorderTopLevel(activeItemOrder, dragging.sectionId, activeDropZone.beforeId);
				reorderItems(next);
			}
		} else if (dragging.kind === "nodes") {
			const { nodeIds, sourceSectionId } = dragging;

			if (activeDropZone.kind === "section-header") {
				const target = getSectionFromId(activeDropZone.sectionId);
				if (!target) return cleanup();
				if (sourceSectionId === activeDropZone.sectionId) return cleanup();

				let newIndex = 0;
				for (const nodeId of nodeIds) {
					removeNodeFromSource(nodeId, sourceSectionId, activeItemOrder, moveNodesToSection, reorderNodesInSection, reorderItems);
					newIndex = target.nodeIds.filter((id) => !nodeIds.includes(id)).length;
				}

				moveNodesToSection(nodeIds, activeDropZone.sectionId, newIndex);

			} else if (activeDropZone.kind === "section-body") {
				const target = getSectionFromId(activeDropZone.sectionId);
				if (!target) return cleanup();

				const filteredTargetIds = target.nodeIds.filter((id) => !nodeIds.includes(id));
				const insertIdx = activeDropZone.beforeNodeId
					? filteredTargetIds.indexOf(activeDropZone.beforeNodeId)
					: filteredTargetIds.length;
				const baseIdx = insertIdx === -1 ? filteredTargetIds.length : insertIdx;

				for (let i = 0; i < nodeIds.length; i++) {
					const nodeId = nodeIds[i];
					if (sourceSectionId !== activeDropZone.sectionId) {
						removeNodeFromSource(nodeId, sourceSectionId, activeItemOrder, moveNodesToSection, reorderNodesInSection, reorderItems);
					}
				}

				moveNodesToSection(nodeIds, activeDropZone.sectionId, baseIdx);

			} else if (activeDropZone.kind === "top-level") {

				moveNodesToSection(nodeIds, null, 0);
				// Insert all dragged nodes before the target, preserving their relative order
				let order = activeItemOrder;
				for (const nodeId of nodeIds) {
					if (!order.includes(nodeId)) order = [...order, nodeId];
				}
				// Remove all dragged nodes first, then re-insert at target position as a block
				const withoutDragged = order.filter((id) => !nodeIds.includes(id));
				const insertAt = activeDropZone.beforeId
					? withoutDragged.indexOf(activeDropZone.beforeId)
					: withoutDragged.length;
				const finalIdx = insertAt === -1 ? withoutDragged.length : insertAt;
				const nextOrder = [
					...withoutDragged.slice(0, finalIdx),
					...nodeIds,
					...withoutDragged.slice(finalIdx),
				];
				reorderItems(nextOrder);
			}
		}

		cleanup();
		function cleanup() {
			setDragging(null);
			setActiveDropZone(null);
		}
	}, [dragging, activeDropZone, activeItemOrder, activeSections, reorderItems, moveNodesToSection, reorderNodesInSection]);

	// ── Add section ───────────────────────────────────────────────────────────

	const handleAddSection = () => {
		const name = `Section ${activeSections.length + 1}`;
		if (activeTab) {
			createSection(name, activeTab);
		}
	};

	useEffect(() => {
		// scroll to the bottom if the number of section gets updated
		if (activeTab && lastTabId.current === activeTab.id && lastSectionCount.current != activeSections.length)
			if (bodyRef.current)
				bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });

		lastSectionCount.current = activeSections.length;
	}, [activeSections]);


	useEffect(() => {
		if (!activeTab) return;
		lastTabId.current = activeTab.id;
	}, [activeTab]);

	// ── Deselect on empty space click ─────────────────────────────────────────

	const handleListMouseDown = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) selection.clearSelection();
	};



	// ── Render ────────────────────────────────────────────────────────────────

	const isEmpty = activeNodes.length === 0 && activeSections.length === 0;

	if (isEmpty) {
		return (
			<div className="flex flex-1 flex-col">
				<EmptyState />
			</div>
		);
	}

	return (
		<DndContext.Provider value={{ dragging, activeDropZone, startDrag, setDropZone, endDrag }}>
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Toolbar */}
				<div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
					<Text size="1" className="text-[var(--text-muted)]">
						{activeNodes.length} text layers
						{selection.selectedIds.size > 0 && (
							<span className="ml-1.5 text-[var(--accent)]">
								· {selection.selectedIds.size} selected
							</span>
						)}
					</Text>
					<Button size="1" variant="ghost" onClick={handleAddSection}>
						<PlusIcon size={ICON_SIZE_SMALL} />
						Add Section
					</Button>
				</div>

				{/* List */}
				<div
					className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2.5"
					onMouseDown={handleListMouseDown}
					ref={bodyRef}
				>
					{activeItemOrder.map((id) => {
						const section = getSectionFromId(id);
						const node = getNodeFromId(id);

						const isDropTargetBefore =
							activeDropZone?.kind === "top-level" && activeDropZone.beforeId === id;

						return (
							<React.Fragment key={id}>
								{isDropTargetBefore && <DropIndicator />}

								{section ? (
									<NodeSectionItem
										section={section}
										onDelete={() => deleteSection(section.id)}
										onRename={(name) => renameSection(section.id, name)}
									/>
								) : node ? (
									<NodeCard
										nodeId={id}
										sourceSectionId={null}
									/>
								) : null}
							</React.Fragment>
						);
					})}

					{activeDropZone?.kind === "top-level" && activeDropZone.beforeId === null && (
						<DropIndicator />
					)}

					<div
						className="flex-1 min-h-[40px]"
						onDragOver={(e) => { e.preventDefault(); setDropZone({ kind: "top-level", beforeId: null }); }}
						onDragLeave={() => setDropZone(null)}
						onMouseDown={() => selection.clearSelection()}
					/>
				</div>
			</div>
		</DndContext.Provider>
	);
}
