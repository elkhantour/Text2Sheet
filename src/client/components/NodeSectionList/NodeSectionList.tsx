import React, { useState, useCallback, useMemo } from "react";
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
		moveNodeToSection,
		reorderNodesInSection,
		getNodeFromId,
		getSectionFromId,
	} = usePlugin();

	const { activeTabId, activeNodes, activeSections, activeItemOrder } = useTabs();


	const [dragging, setDragging] = useState<DragItem | null>(null);
	const [activeDropZone, setActiveDropZone] = useState<DropZone | null>(null);


	// ── Selection ─────────────────────────────────────────────────────────────
	const selection = useNodeSelection();

	// Flat ordered list of all visible node IDs for range-select
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
		} else if (dragging.kind === "node") {
			const { nodeId, sourceSectionId } = dragging;

			if (activeDropZone.kind === "section-header") {
				const target = getSectionFromId(activeDropZone.sectionId);
				if (!target) return cleanup();
				if (sourceSectionId === activeDropZone.sectionId) return cleanup();
				const newIds = [...target.nodeIds.filter((id) => id !== nodeId), nodeId];
				removeNodeFromSource(nodeId, sourceSectionId, activeItemOrder, moveNodeToSection, reorderNodesInSection, reorderItems);
				moveNodeToSection(nodeId, activeDropZone.sectionId, newIds.length - 1);

			} else if (activeDropZone.kind === "section-body") {
				const target = getSectionFromId(activeDropZone.sectionId);
				if (!target) return cleanup();
				const filtered = target.nodeIds.filter((id) => id !== nodeId);
				const insertIdx = activeDropZone.beforeNodeId
					? filtered.indexOf(activeDropZone.beforeNodeId)
					: filtered.length;
				const finalIdx = insertIdx === -1 ? filtered.length : insertIdx;
				if (sourceSectionId !== activeDropZone.sectionId) {
					removeNodeFromSource(nodeId, sourceSectionId, activeItemOrder, moveNodeToSection, reorderNodesInSection, reorderItems);
				}
				moveNodeToSection(nodeId, activeDropZone.sectionId, finalIdx);

			} else if (activeDropZone.kind === "top-level") {
				if (sourceSectionId !== null) {
					moveNodeToSection(nodeId, null, 0);
				}
				const nextOrder = reorderTopLevel(
					activeItemOrder.includes(nodeId) ? activeItemOrder : [...activeItemOrder, nodeId],
					nodeId,
					activeDropZone.beforeId,
				);
				reorderItems(nextOrder);
			}
		}

		cleanup();
		function cleanup() {
			setDragging(null);
			setActiveDropZone(null);
		}
	}, [dragging, activeDropZone, activeItemOrder, activeSections, reorderItems, moveNodeToSection, reorderNodesInSection]);

	// ── Add section ───────────────────────────────────────────────────────────

	const handleAddSection = () => {
		const name = `Section ${activeSections.length + 1}`;
		if (activeTabId) createSection(name, activeTabId);
	};

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
