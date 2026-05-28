import React, { useState } from "react";
import type { MarkedNode, NodeSection } from "@ctypes/messages";
import { useDnd } from "@components/Dnd/Context";
import { NodeContextMenu } from "@components/NodeCard/NodeContextMenu";
import type { NodeSelectionState } from "@hooks/useNodeSelection";

interface NodeCardProps {
	node: MarkedNode;
	index: number;
	onUnmark: (id: string) => void;
	onSelect: (id: string) => void;
	/** null = loose top-level card, string = inside a section */
	sourceSectionId: string | null;
	/** Called when pointer hovers this card inside a section body */
	onDragOverGap?: (beforeNodeId: string) => void;
	// ── Selection ────────────────────────────────────────────────────────────
	selection: NodeSelectionState;
	/** Flat ordered list of all visible node IDs — used for range select */
	orderedNodeIds: string[];
	// ── Context menu actions ─────────────────────────────────────────────────
	sections: NodeSection[];
	onMoveToSection: (nodeIds: string[], sectionId: string) => void;
	onRemoveFromSection: (nodeIds: string[], sectionId: string) => void;
}

export function NodeCard({
	node,
	onUnmark,
	onSelect,
	sourceSectionId,
	onDragOverGap,
	selection,
	orderedNodeIds,
	sections,
	onMoveToSection,
	onRemoveFromSection,
}: NodeCardProps): React.ReactElement {
	const [hovered, setHovered] = useState(false);
	const { dragging, startDrag, setDropZone, endDrag } = useDnd();

	const isDragging = dragging?.kind === "node" && dragging.nodeId === node.id;
	const isSelected = selection.isSelected(node.id);

	const previewLines: string[] =
		node.nodeType !== "TEXT" && node.childTextNodes?.length
			? node.childTextNodes.map((c) => c.content).filter(Boolean)
			: node.previewText
				? [node.previewText]
				: [];

	// ── Click → selection ────────────────────────────────────────────────────

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (e.shiftKey) {
			selection.rangeSelect(node.id, orderedNodeIds);
		} else if (e.metaKey || e.ctrlKey) {
			selection.toggle(node.id);
		} else {
			selection.select(node.id);
		}
	};

	// ── Drag source ──────────────────────────────────────────────────────────

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = "move";
		e.stopPropagation();
		startDrag({ kind: "node", nodeId: node.id, sourceSectionId });
	};

	const handleDragOver = (e: React.DragEvent) => {
		if (dragging?.kind !== "node") return;
		e.preventDefault();
		e.stopPropagation();
		if (onDragOverGap) {
			onDragOverGap(node.id);
		} else {
			setDropZone({ kind: "top-level", beforeId: node.id });
		}
	};

	const handleDragEnd = () => endDrag();
	const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); endDrag(); };

	// ── Context menu actions ─────────────────────────────────────────────────

	// Affected IDs: whole selection if this card is in it, else just this card
	const affectedIds = (ids: Set<string>) =>
		ids.has(node.id) ? [...ids] : [node.id];

	const handleMoveToSection = (sectionId: string) => {
		onMoveToSection(affectedIds(selection.selectedIds), sectionId);
	};

	const handleRemoveFromSection = () => {
		if (!sourceSectionId) return;
		onRemoveFromSection(affectedIds(selection.selectedIds), sourceSectionId);
	};

	const handleUnmark = (id: string) => {
		// If the card is part of a selection, remove all selected
		const ids = selection.selectedIds.has(id)
			? [...selection.selectedIds]
			: [id];
		for (const nodeId of ids) onUnmark(nodeId);
	};

	// ── Render ───────────────────────────────────────────────────────────────

	return (
		<NodeContextMenu
			nodeId={node.id}
			sourceSectionId={sourceSectionId}
			selectedIds={selection.selectedIds}
			sections={sections}
			onUnmark={handleUnmark}
			onMoveToSection={handleMoveToSection}
			onRemoveFromSection={handleRemoveFromSection}
		>
			<div
				draggable
				data-hovered={hovered}
				data-dragging={isDragging}
				data-selected={isSelected}
				onClick={handleClick}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
				onDrop={handleDrop}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				className="
					group select-none rounded-md border px-3 py-2.5
					transition-all duration-150 cursor-grab
					border-[var(--border)] bg-[var(--surface)]
					data-[hovered=true]:border-[var(--border-light)]
					data-[hovered=true]:bg-[var(--surface-2)]
					data-[selected=true]:border-[var(--accent)]
					data-[selected=true]:bg-[var(--accent-dim)]
					data-[dragging=true]:border-[var(--accent)]
					data-[dragging=true]:opacity-40
				"
			>
				{/* Top row */}
				<div className="flex items-center gap-2">
					<span className="w-4 shrink-0 text-center font-mono text-[var(--text-muted)]">⠿</span>

					<span className={`flex-1 truncate text-xs font-medium transition-colors ${
						isSelected ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
					}`}>
						{node.previewText}
					</span>

					<div className="flex shrink-0 gap-1">
						<ActionButton title="Focus layer in canvas" onClick={() => onSelect(node.id)}>
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
								<path d="M1 1h3.5M1 1v3.5M11 1h-3.5M11 1v3.5M1 11h3.5M1 11v-3.5M11 11h-3.5M11 11v-3.5"
									stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
							</svg>
						</ActionButton>
						<ActionButton title="Remove from export" onClick={() => handleUnmark(node.id)} danger>
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
								<path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
							</svg>
						</ActionButton>
					</div>
				</div>

				{/* Preview lines */}
				{previewLines.length > 1 && (
					<div className="mt-1.5 ml-6 flex flex-col gap-0.5">
						{previewLines.map((line, i) => (
							<div key={i} className="truncate font-mono text-[11px] text-[var(--text-muted)]">
								{line}
							</div>
						))}
					</div>
				)}
			</div>
		</NodeContextMenu>
	);
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
	title: string;
	onClick: () => void;
	danger?: boolean;
	children: React.ReactNode;
}

function ActionButton({ title, onClick, danger, children }: ActionButtonProps): React.ReactElement {
	return (
		<button
			title={title}
			onClick={(e) => { e.stopPropagation(); onClick(); }}
			data-danger={danger || undefined}
			className="
				flex h-6 w-6 flex-shrink-0 items-center justify-center
				rounded-[6px] border border-transparent
				text-[var(--text-muted)] transition-all
				hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]
				data-[danger=true]:hover:bg-[var(--danger-dim)]
				data-[danger=true]:hover:text-[var(--danger)]
			"
		>
			{children}
		</button>
	);
}
