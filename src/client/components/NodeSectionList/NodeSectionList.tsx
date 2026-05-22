import React, { useState, useCallback } from "react";
import type { MarkedNode, NodeSection } from "@ctypes/messages";
import type { DragItem, DropZone } from "@components/Dnd/Context";
import { DndContext } from "@components/Dnd/Context";
import { NodeSectionItem } from "@components/NodeSectionItem/NodeSectionItem";
import { NodeCard } from "@components/NodeCard/NodeCard";
import { DropIndicator } from "@components/Dnd/DropIndicator";
import { EmptyState } from "./EmptyState";
import { removeNodeFromSource, reorderTopLevel } from "./Helpers";

interface NodeSectionListProps {
	nodes: MarkedNode[];
	sections: NodeSection[];
	/** Ordered array of top-level ids — each is either a nodeId or a sectionId */
	itemOrder: string[];
	onUnmark: (nodeId: string) => void;
	onSelect: (nodeId: string) => void;
	onCreateSection: (name: string) => void;
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

	// ── Helpers ──────────────────────────────────────────────────────────────

	const startDrag = useCallback((item: DragItem) => setDragging(item), []);
	const setDropZone = useCallback((zone: DropZone | null) => setActiveDropZone(zone), []);

	const endDrag = useCallback(() => {
		if (!dragging || !activeDropZone) {
			setDragging(null);
			setActiveDropZone(null);
			return;
		}

		if (dragging.kind === "section") {
			// ── Reorder sections / loose nodes at top level ──────────────────
			if (activeDropZone.kind === "top-level") {
				const next = reorderTopLevel(itemOrder, dragging.sectionId, activeDropZone.beforeId);
				onReorderItems(next);
			}

		} else if (dragging.kind === "node") {
			const { nodeId, sourceSectionId } = dragging;

			if (activeDropZone.kind === "section-header") {
				// Append to section
				const target = sectionMap.get(activeDropZone.sectionId);
				if (!target) return cleanup();
				if (sourceSectionId === activeDropZone.sectionId) return cleanup(); // no-op

				// Remove from source, then append
				const newIds = [...target.nodeIds.filter((id) => id !== nodeId), nodeId];
				removeNodeFromSource(nodeId, sourceSectionId, itemOrder, onMoveNodeToSection, onReorderNodesInSection, onReorderItems);
				onMoveNodeToSection(nodeId, activeDropZone.sectionId, newIds.length - 1);

			} else if (activeDropZone.kind === "section-body") {
				// Insert at position inside section
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
				// Move card to loose area
				if (sourceSectionId !== null) {
					onMoveNodeToSection(nodeId, null, 0); // plugin will handle index via itemOrder
				}
				const nextOrder = reorderTopLevel(
					// Remove nodeId if already loose, then re-insert
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

	// ── Add section ──────────────────────────────────────────────────────────

	const handleAddSection = () => {
		const name = `Section ${sections.length + 1}`;
		onCreateSection(name);
	};

	// ── Render ───────────────────────────────────────────────────────────────

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
				<div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-light)]">
					<span className="text-xs text-[var(--text-muted)]">
						{nodes.length} layer{nodes.length !== 1 ? "s" : ""}
					</span>
					<button
						onClick={handleAddSection}
						className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
						           text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
					>
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
							<path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
						Add Section
					</button>
				</div>

				{/* List */}
				<div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2.5">
					{itemOrder.map((id, idx) => {
						const section = sectionMap.get(id);
						const node = nodeMap.get(id);

						const isDropTargetBefore =
							activeDropZone?.kind === "top-level" && activeDropZone.beforeId === id;

						return (
							<React.Fragment key={id}>
								{/* Drop indicator above this item */}
								{isDropTargetBefore && <DropIndicator />}

								{section ? (
									<NodeSectionItem
										section={section}
										nodeMap={nodeMap}
										onUnmark={onUnmark}
										onSelect={onSelect}
										onDelete={() => onDeleteSection(section.id)}
										onRename={(name) => onRenameSection(section.id, name)}
									/>
								) : node ? (
									<NodeCard
										node={node}
										index={idx}
										onUnmark={onUnmark}
										onSelect={onSelect}
										sourceSectionId={null}
									/>
								) : null}
							</React.Fragment>
						);
					})}

					{/* Drop indicator at end of list */}
					{activeDropZone?.kind === "top-level" && activeDropZone.beforeId === null && (
						<DropIndicator />
					)}

					{/* Spacer drop zone at bottom (for dragging to end) */}
					<div
						className="flex-1 min-h-[40px]"
						onDragOver={(e) => { e.preventDefault(); setDropZone({ kind: "top-level", beforeId: null }); }}
						onDragLeave={() => setDropZone(null)}
					/>
				</div>
			</div>
		</DndContext.Provider>
	);
}

