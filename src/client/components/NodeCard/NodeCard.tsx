import React, { useCallback, useState } from "react";
import type { MarkedNode } from "@ctypes/messages";
import { useDnd } from "@components/Dnd/Context";
import { useNodeSelection } from "@hooks/useNodeSelection";
import { NodeContextMenu } from "./NodeContextMenu";
import { usePlugin } from "@hooks/usePlugin";
import { useTabs } from "@hooks/useTabs";

interface NodeCardProps {
	nodeId: string;
	// DELETE ME index: number;
	/** null = loose top-level card, string = inside a section */
	sourceSectionId: string | null;
	/** Called when pointer hovers this card inside a section body */
	onDragOverGap?: (beforeNodeId: string) => void;
}

export function NodeCard({
	nodeId,
	sourceSectionId,
	onDragOverGap,
}: NodeCardProps): React.ReactElement {

	const {
		unmarkNode,
		markedNodes,
		selectNode,
		itemOrder,
		sections,
		moveNodeToSection,
		getSectionFromId,
		getNodeFromId,
	} = usePlugin();


	const {
		activeTabId
	} = useTabs(markedNodes, sections, itemOrder);

	const selection = useNodeSelection(activeTabId);

	const [hovered, setHovered] = useState(false);
	const { dragging, startDrag, setDropZone, endDrag } = useDnd();

	const node: MarkedNode | undefined = getNodeFromId(nodeId);

	const isDragging = dragging?.kind === "node" && dragging.nodeId === nodeId;
	const isSelected = selection.isSelected(nodeId);

	const previewLines: string[] =
		node && node.nodeType !== "TEXT" && node.childTextNodes?.length
			? node.childTextNodes.map((c) => c.content).filter(Boolean)
			: node?.previewText
				? [node.previewText]
				: [];

	// ── Click → selection ────────────────────────────────────────────────────

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (e.shiftKey) {
			selection.rangeSelect(nodeId, itemOrder);
		} else if (e.metaKey || e.ctrlKey) {
			selection.toggle(nodeId);
		} else {
			selection.select(nodeId);
		}
	};

	// ── Drag source ──────────────────────────────────────────────────────────

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = "move";
		e.stopPropagation();
		startDrag({ kind: "node", nodeId: nodeId, sourceSectionId });
	};

	const handleDragOver = (e: React.DragEvent) => {
		if (dragging?.kind !== "node") return;
		e.preventDefault();
		e.stopPropagation();
		if (onDragOverGap) {
			onDragOverGap(nodeId);
		} else {
			setDropZone({ kind: "top-level", beforeId: nodeId });
		}
	};

	const handleDragEnd = () => endDrag();
	const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); endDrag(); };

	const handleUnmark = (id: string) => {
		// If the card is part of a selection, remove all selected
		const ids = selection.selectedIds.has(id)
			? [...selection.selectedIds]
			: [id];
		for (const nodeId of ids) unmarkNode(nodeId);
	};

	// ── Context menu actions ──────────────────────────────────────────────────

	const handleMoveToSection = useCallback((nodeIds: Set<string>, sectionId: string) => {
		const target = getSectionFromId(sectionId);
		if (!target) return;
		for (const nodeId of nodeIds) {
			moveNodeToSection(nodeId, sectionId, target.nodeIds.length);
		}
		selection.clearSelection();
	}, [sections, moveNodeToSection, selection]);

	const handleRemoveFromSection = useCallback((nodeIds: Set<string>) => {
		for (const nodeId of nodeIds) {
			moveNodeToSection(nodeId, null, 0);
		}
		selection.clearSelection();
	}, [moveNodeToSection, selection]);


	// ── Render ───────────────────────────────────────────────────────────────

	return (
		<NodeContextMenu
			activeTabId={activeTabId}
			sections={sections}
			onUnmark={() => {}} // TODO: handleUnmark from NodeCard.tsx
			onMoveToSection={handleMoveToSection}
			onRemoveFromSection={handleRemoveFromSection}
			isOpen={selection.contextMenu.isOpen}
			position={selection.contextMenu.position}
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
				onContextMenu={selection.contextMenu.open}
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

					<span className={`flex-1 truncate text-xs font-medium transition-colors ${isSelected ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
						}`}>
						{node?.previewText}
					</span>

					<div className="flex shrink-0 gap-1">
						<ActionButton title="Focus layer in canvas" onClick={() => selectNode(nodeId)}>
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
								<path d="M1 1h3.5M1 1v3.5M11 1h-3.5M11 1v3.5M1 11h3.5M1 11v-3.5M11 11h-3.5M11 11v-3.5"
									stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
							</svg>
						</ActionButton>
						<ActionButton title="Remove from export" onClick={() => handleUnmark(nodeId)} danger>
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
