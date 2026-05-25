import React, { useState } from "react";
import type { MarkedNode } from "@ctypes/messages";
import { useDnd } from "@components/Dnd/Context";

interface NodeCardProps {
	node: MarkedNode;
	index: number;
	onUnmark: (id: string) => void;
	onSelect: (id: string) => void;
	/** null = loose top-level card, string = inside a section */
	sourceSectionId: string | null;
	/** Called when pointer hovers this card inside a section body — signals "insert before me" */
	onDragOverGap?: (beforeNodeId: string) => void;
}

export function NodeCard({
	node,
	onUnmark,
	onSelect,
	sourceSectionId,
	onDragOverGap,
}: NodeCardProps): React.ReactElement {
	const [hovered, setHovered] = useState(false);
	const { dragging, startDrag, setDropZone, endDrag } = useDnd();

	const isDragging = dragging?.kind === "node" && dragging.nodeId === node.id;

	const previewLines: string[] = [];

	// ── Drag source ──────────────────────────────────────────────────────────

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = "move";
		e.stopPropagation(); // prevent section header from also firing
		startDrag({ kind: "node", nodeId: node.id, sourceSectionId });
	};

	const handleDragOver = (e: React.DragEvent) => {
		if (dragging?.kind !== "node") return;
		e.preventDefault();
		e.stopPropagation();
		if (onDragOverGap) {
			// Inside a section — parent SectionBody owns the drop zone state
			onDragOverGap(node.id);
		} else {
			// Loose top-level card — signal reorder
			setDropZone({ kind: "top-level", beforeId: node.id });
		}
	};

	const handleDragEnd = () => endDrag();

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		endDrag();
	};

	return (
		<div
			draggable
			data-hovered={hovered}
			data-dragging={isDragging}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
			onDrop={handleDrop}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			className="
				group
				select-none
				rounded-md
				border
				border-[var(--border)]
				bg-[var(--surface)]
				px-3
				py-2.5
				transition-all
				duration-150
				cursor-grab
				data-[hovered=true]:border-[var(--border-light)]
				data-[hovered=true]:bg-[var(--surface-2)]
				data-[dragging=true]:border-[var(--accent)]
				data-[dragging=true]:opacity-40
			"
		>
			{/* Top row */}
			<div className="flex items-center gap-2">
				{/* Drag handle + index */}
				<span className="w-4 shrink-0 text-center font-mono text-[10px] text-[var(--text-muted)]">
					⠿
				</span>
				{/* Layer name */}
				<span
					className="
						flex-1
						truncate
						text-xs
						font-medium
						text-[var(--text-primary)]
					"
				>
					{node.previewText}
				</span>
				{/* Actions */}
				<div className="flex shrink-0 gap-1">
					<ActionButton title="Focus layer in canvas" onClick={() => onSelect(node.id)}>
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
							<path
								d="M1 1h3.5M1 1v3.5M11 1h-3.5M11 1v3.5M1 11h3.5M1 11v-3.5M11 11h-3.5M11 11v-3.5"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinecap="round"
							/>
						</svg>
					</ActionButton>
					<ActionButton title="Remove from export" onClick={() => onUnmark(node.id)} danger>
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
							<path
								d="M2 2l8 8M10 2L2 10"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinecap="round"
							/>
						</svg>
					</ActionButton>
				</div>
			</div>
			{/* Preview lines */}
			{previewLines.length > 0 && (
				<div className="mt-1.5 ml-6 flex flex-col gap-0.5">
					{previewLines.map((line, i) => (
						<div
							key={i}
							className="
								truncate
								font-mono
								text-[11px]
								text-[var(--text-muted)]
							"
						>
							{line}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

interface ActionButtonProps {
	title: string;
	onClick: () => void;
	danger?: boolean;
	children: React.ReactNode;
}

function ActionButton({
	title,
	onClick,
	danger,
	children,
}: ActionButtonProps): React.ReactElement {
	return (
		<button
			title={title}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			data-danger={danger || undefined}
			className="
				group
				flex
				h-6
				w-6
				flex-shrink-0
				items-center
				justify-center
				rounded-[6px]
				border
				border-transparent
				text-[var(--text-muted)]
				transition-all
				hover:bg-[var(--surface-3)]
				hover:text-[var(--text-primary)]
				data-[danger=true]:hover:bg-[var(--danger-dim)]
				data-[danger=true]:hover:text-[var(--danger)]
			"
		>
			{children}
		</button>
	);
}
