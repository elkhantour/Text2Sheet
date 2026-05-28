import React, { useState, useCallback, useMemo } from "react";
import type { FrameTab, MarkedNode, NodeSection } from "@ctypes/messages";
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
import { useNodeSelection } from "@hooks/useNodeSelection";

interface NodeSectionListProps {
	nodes: MarkedNode[];
	sections: NodeSection[];
	itemOrder: string[];
	activeTabId: string | null;
	tabs: FrameTab[];
	onUnmark: (nodeId: string) => void;
	onSelect: (nodeId: string) => void;
	onCreateSection: (name: string, topFrameId: string) => void;
	onDeleteSection: (sectionId: string) => void;
	onRenameSection: (sectionId: string, name: string) => void;
	onReorderItems: (itemIds: string[]) => void;
	onMoveNodeToSection: (nodeId: string, sectionId: string | null, index: number) => void;
	onReorderNodesInSection: (sectionId: string, nodeIds: string[]) => void;
}

export function NodeSectionList({
	nodes,
	sections,
	itemOrder,
	activeTabId,
	tabs,
	onUnmark,
	onSelect,
	onCreateSection,
	onDeleteSection,
	onRenameSection,
	onReorderItems,
	onMoveNodeToSection,
	onReorderNodesInSection,
}: NodeSectionListProps): React.ReactElement {
	const [dragging, setDragging] = useState<DragItem | null>(null);
	const [activeDropZone, setActiveDropZone] = useState<DropZone | null>(null);

	const nodeMap = new Map(nodes.map((n) => [n.id, n]));
	const sectionMap = new Map(sections.map((s) => [s.id, s]));

	// ── Selection ─────────────────────────────────────────────────────────────
	const selection = useNodeSelection(activeTabId);

	// Flat ordered list of all visible node IDs for range-select
	const orderedNodeIds = useMemo(() => {
		const ids: string[] = [];
		for (const id of itemOrder) {
			if (nodeMap.has(id)) {
				ids.push(id);
			} else {
				const section = sectionMap.get(id);
				if (section) ids.push(...section.nodeIds.filter((nid) => nodeMap.has(nid)));
			}
		}
		return ids;
	}, [itemOrder, nodeMap, sectionMap]);

	// ── Context menu actions ──────────────────────────────────────────────────

	const handleMoveToSection = useCallback((nodeIds: string[], sectionId: string) => {
		const target = sectionMap.get(sectionId);
		if (!target) return;
		for (const nodeId of nodeIds) {
			onMoveNodeToSection(nodeId, sectionId, target.nodeIds.length);
		}
		selection.clearSelection();
	}, [sectionMap, onMoveNodeToSection, selection]);

	const handleRemoveFromSection = useCallback((nodeIds: string[], sectionId: string) => {
		for (const nodeId of nodeIds) {
			onMoveNodeToSection(nodeId, null, 0);
		}
		selection.clearSelection();
	}, [onMoveNodeToSection, selection]);

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
				const next = reorderTopLevel(itemOrder, dragging.sectionId, activeDropZone.beforeId);
				onReorderItems(next);
			}
		} else if (dragging.kind === "node") {
			const { nodeId, sourceSectionId } = dragging;

			if (activeDropZone.kind === "section-header") {
				const target = sectionMap.get(activeDropZone.sectionId);
				if (!target) return cleanup();
				if (sourceSectionId === activeDropZone.sectionId) return cleanup();
				const newIds = [...target.nodeIds.filter((id) => id !== nodeId), nodeId];
				removeNodeFromSource(nodeId, sourceSectionId, itemOrder, onMoveNodeToSection, onReorderNodesInSection, onReorderItems);
				onMoveNodeToSection(nodeId, activeDropZone.sectionId, newIds.length - 1);

			} else if (activeDropZone.kind === "section-body") {
				const target = sectionMap.get(activeDropZone.sectionId);
				if (!target) return cleanup();
				const filtered = target.nodeIds.filter((id) => id !== nodeId);
				const insertIdx = activeDropZone.beforeNodeId
					? filtered.indexOf(activeDropZone.beforeNodeId)
					: filtered.length;
				const finalIdx = insertIdx === -1 ? filtered.length : insertIdx;
				if (sourceSectionId !== activeDropZone.sectionId) {
					removeNodeFromSource(nodeId, sourceSectionId, itemOrder, onMoveNodeToSection, onReorderNodesInSection, onReorderItems);
				}
				onMoveNodeToSection(nodeId, activeDropZone.sectionId, finalIdx);

			} else if (activeDropZone.kind === "top-level") {
				if (sourceSectionId !== null) {
					onMoveNodeToSection(nodeId, null, 0);
				}
				const nextOrder = reorderTopLevel(
					itemOrder.includes(nodeId) ? itemOrder : [...itemOrder, nodeId],
					nodeId,
					activeDropZone.beforeId,
				);
				onReorderItems(nextOrder);
			}
		}

		cleanup();
		function cleanup() {
			setDragging(null);
			setActiveDropZone(null);
		}
	}, [dragging, activeDropZone, itemOrder, sectionMap, onReorderItems, onMoveNodeToSection, onReorderNodesInSection]);

	// ── Add section ───────────────────────────────────────────────────────────

	const handleAddSection = () => {
		const name = `Section ${sections.length + 1}`;
		if (activeTabId) onCreateSection(name, activeTabId);
	};

	// ── Deselect on empty space click ─────────────────────────────────────────

	const handleListMouseDown = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) selection.clearSelection();
	};

	// ── Render ────────────────────────────────────────────────────────────────

	const isEmpty = nodes.length === 0 && sections.length === 0;

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
						{nodes.length} text layers
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
					{itemOrder.map((id, idx) => {
						const section = sectionMap.get(id);
						const node = nodeMap.get(id);

						const isDropTargetBefore =
							activeDropZone?.kind === "top-level" && activeDropZone.beforeId === id;

						return (
							<React.Fragment key={id}>
								{isDropTargetBefore && <DropIndicator />}

								{section ? (
									<NodeSectionItem
										section={section}
										nodeMap={nodeMap}
										onUnmark={onUnmark}
										onSelect={onSelect}
										onDelete={() => onDeleteSection(section.id)}
										onRename={(name) => onRenameSection(section.id, name)}
										selection={selection}
										orderedNodeIds={orderedNodeIds}
										sections={sections}
										onMoveToSection={handleMoveToSection}
										onRemoveFromSection={handleRemoveFromSection}
									/>
								) : node ? (
									<NodeCard
										node={node}
										index={idx}
										onUnmark={onUnmark}
										onSelect={onSelect}
										sourceSectionId={null}
										selection={selection}
										orderedNodeIds={orderedNodeIds}
										sections={sections}
										onMoveToSection={handleMoveToSection}
										onRemoveFromSection={handleRemoveFromSection}
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
