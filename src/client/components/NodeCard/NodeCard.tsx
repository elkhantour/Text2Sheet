import React from "react";
import type { MarkedNode } from "@ctypes/messages";
import { useDnd } from "@components/Dnd/Context";
import { useNodeSelection } from "@contexts/useNodeSelection";
import { NodeContextMenu } from "./NodeContextMenu";
import { usePlugin } from "@contexts/usePlugin";
import { GripVertical, ScanIcon, XIcon } from "lucide-react";
import { ICON_SIZE_EXTRA_SMALL } from "@utils/constants";

interface NodeCardProps {
	node: MarkedNode;
	// DELETE ME index: number;
	/** null = loose top-level card, string = inside a section */
	sourceSectionId: string | null;
	/** Called when pointer hovers this card inside a section body */
	onDragOverGap?: (beforeNodeId: string) => void;
}

export function NodeCard({
	node,
	sourceSectionId,
	onDragOverGap,
}: NodeCardProps): React.ReactElement {

	const {
		unmarkNodes,
		selectNode,
		activeTab,
	} = usePlugin();

	const selection = useNodeSelection();

	const selected = selection.isSelected(node.id);

	const { dragging, startDrag, setDropZone, endDrag } = useDnd();

	const isDragging = dragging?.kind === "nodes" && dragging.nodeIds[0] === node.id;

	const previewLines: string[] =
		node && node.nodeType !== "TEXT" && node.childTextNodes?.length
			? node.childTextNodes.map((c) => c.content).filter(Boolean)
			: node?.previewText
				? [node.previewText]
				: [];

	// ── Click → selection ────────────────────────────────────────────────────

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();

		if (e.shiftKey && activeTab) {
			selection.rangeSelect(node.id, activeTab.itemOrder);
		} else if (e.metaKey || e.ctrlKey) {
			selection.toggle(node.id);
		} else {

			if (selection.isSelected(node.id)) {
				selection.toggle(node.id);
			} else {
				//selection.clearSelection();
				selection.select(node.id);
			}
		}
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!selection.isSelected(node.id)) {
			selection.toggle(node.id);
		}
	};



	// ── Drag source ──────────────────────────────────────────────────────────

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = "move";
		e.stopPropagation();
		startDrag({ kind: "nodes", nodeIds: getDraggableNodes(node.id), sourceSectionId });
	};

	const handleDragOver = (e: React.DragEvent) => {
		if (dragging?.kind !== "nodes") return;
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

	const handleUnmark = (id: string) => {
		// If the card is part of a selection, remove all selected
		const ids = getDraggableNodes(id);
		unmarkNodes(ids);
		ids.forEach(selection.deselect);
	};

	// ── Helper ───────────────────────────────────────────────────────────────
	const getDraggableNodes = (id: string) => selection.selectedIds.has(id)
		? [...selection.selectedIds]
		: [id];

	// ── Render ───────────────────────────────────────────────────────────────

	return (
		<NodeContextMenu>
			<div
				draggable
				data-dragging={isDragging}
				data-selected={selected}
				onClick={handleClick}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
				onDrop={handleDrop}
				onContextMenu={handleContextMenu}
				className="
					group select-none rounded-md border px-3 py-2.5
					transition-all duration-150 cursor-grab
					border-[var(--border)] bg-[var(--surface)]
					hover:border-[var(--border-light)]
					hover:bg-[var(--surface-2)]
					data-[selected=true]:border-[var(--accent)]
					data-[selected=true]:bg-[var(--accent-dim)]
					data-[dragging=true]:border-[var(--accent)]
					data-[dragging=true]:opacity-40
				">
				{/* Top row */}
				<div className="flex items-center gap-2">
					<GripVertical size={ICON_SIZE_EXTRA_SMALL} className="text-[var(--text-muted)]" />

					<span className={`flex-1 truncate text-xs font-medium transition-colors ${selected ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
						}`}>
						{node?.previewText}
					</span>

					<div className="flex shrink-0 gap-1">
						<ActionButton title="Focus layer in canvas" onClick={() => selectNode(node.id)}>
							<ScanIcon size={ICON_SIZE_EXTRA_SMALL} />
						</ActionButton>
						<ActionButton title="Remove from export" onClick={() => handleUnmark(node.id)} danger>
							<XIcon size={ICON_SIZE_EXTRA_SMALL} />
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
		</NodeContextMenu >
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
