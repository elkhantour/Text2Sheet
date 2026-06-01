import React from "react";
import type { MarkedNode } from "@ctypes/messages";
import { useDnd } from "@components/Dnd/Context";
import { useNodeSelection } from "@contexts/useNodeSelection";
import { NodeContextMenu } from "./NodeContextMenu";
import { usePlugin } from "@hooks/usePlugin";
import { FrameIcon, XIcon } from "lucide-react";
import { ICON_SIZE_EXTRA_SMALL, ICON_SIZE_SMALL } from "@utils/constants";

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
		selectNode,
		itemOrder,
		getNodeFromId,
	} = usePlugin();

	const selection = useNodeSelection();

	const selected = selection.isSelected(nodeId);

	const { dragging, startDrag, setDropZone, endDrag } = useDnd();

	const node: MarkedNode | undefined = getNodeFromId(nodeId);

	const isDragging = dragging?.kind === "node" && dragging.nodeId === nodeId;

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

			if (selection.isSelected(nodeId)) {
				selection.toggle(nodeId);
			} else {
				//selection.clearSelection();
				selection.select(nodeId);
			}
		}
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!selection.isSelected(nodeId)) {
			selection.toggle(nodeId);
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
					<span className="w-4 shrink-0 text-center font-mono text-[var(--text-muted)]">⠿</span>

					<span className={`flex-1 truncate text-xs font-medium transition-colors ${selected ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
						}`}>
						{node?.previewText}
					</span>

					<div className="flex shrink-0 gap-1">
						<ActionButton title="Focus layer in canvas" onClick={() => selectNode(nodeId)}>
							<FrameIcon size={ICON_SIZE_EXTRA_SMALL} />
						</ActionButton>
						<ActionButton title="Remove from export" onClick={() => handleUnmark(nodeId)} danger>
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
