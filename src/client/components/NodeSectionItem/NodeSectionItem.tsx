import React, { useState, useRef } from "react";
import type { MarkedNode, NodeSection } from "@ctypes/messages";
import { useDnd } from "@components/Dnd/Context";
import { SectionBody } from "./SectionBody";
import { usePlugin } from "@contexts/usePlugin";
import { ChevronDown, GripVertical, XIcon } from "lucide-react";
import { ICON_SIZE_EXTRA_SMALL } from "@utils/constants";

interface NodeSectionItemProps {
	section: NodeSection;
	onDelete: () => void;
	onRename: (name: string) => void;
}

export function NodeSectionItem({
	section,
	onDelete,
	onRename,
}: NodeSectionItemProps): React.ReactElement {

	const { dragging, activeDropZone, startDrag, setDropZone, endDrag } = useDnd();
	const [collapsed, setCollapsed] = useState(section.collapsed ?? false);
	const [isEditingName, setIsEditingName] = useState(false);
	const [draftName, setDraftName] = useState(section.name);
	const inputRef = useRef<HTMLInputElement>(null);

	const isDraggingThis = dragging?.kind === "section" && dragging.sectionId === section.id;
	const isHeaderDropTarget =
		(activeDropZone?.kind === "section-header" || activeDropZone?.kind === "section-body") &&
		activeDropZone.sectionId === section.id;

	const sectionNodes = section.nodes.filter(Boolean) as MarkedNode[];

	// ── Section drag ─────────────────────────────────────────────────────────

	const handleHeaderDragStart = (e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = "move";
		startDrag({ kind: "section", sectionId: section.id });
	};

	const handleHeaderDragEnd = () => endDrag();

	const handleHeaderDragOver = (e: React.DragEvent) => {
		if (dragging?.kind !== "nodes") return;
		e.preventDefault();
		e.stopPropagation();
		setDropZone({ kind: "section-header", sectionId: section.id });
	};

	const handleHeaderDragLeave = () => {
		if (activeDropZone?.kind === "section-header" && activeDropZone.sectionId === section.id) {
			setDropZone(null);
		}
	};

	const handleHeaderDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		endDrag();
	};

	// ── Name editing ─────────────────────────────────────────────────────────

	const commitRename = () => {
		const trimmed = draftName.trim();
		if (trimmed && trimmed !== section.name) onRename(trimmed);
		else setDraftName(section.name);
		setIsEditingName(false);
	};

	const handleNameKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") commitRename();
		if (e.key === "Escape") { setDraftName(section.name); setIsEditingName(false); }
	};


	return (
		<div
			data-target={isHeaderDropTarget}
			data-dragging={isDraggingThis}
			className="
	                 	rounded-md border transition-all
                 		border-[var(--border-light)]
                 		bg-[var(--bg-secondary)]
                 		data-[target=true]:border-[var(--accent)]
                 		data-[target=true]:bg-[var(--accent-subtle)]
                 		data-[active=true]:border-[var(--accent)]
                 		data-[active=true]:bg-[var(--accent-subtle)]
                 		data-[dragging=true]:opacity-40
                 	">
			{/* ── Header ── */}
			<div
				draggable
				onDragStart={handleHeaderDragStart}
				onDragEnd={handleHeaderDragEnd}
				onDragOver={handleHeaderDragOver}
				onDragLeave={handleHeaderDragLeave}
				onDrop={handleHeaderDrop}
				className="flex items-center gap-1.5 px-2 py-1.5 cursor-grab active:cursor-grabbing select-none"
			>
				<GripVertical size={ICON_SIZE_EXTRA_SMALL} className="text-[var(--text-muted)]" />
				<button
					onClick={() => setCollapsed((c) => !c)}
					className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
				>
					<ChevronDown size={ICON_SIZE_EXTRA_SMALL} className={`transition-transform ${collapsed ? "-rotate-90" : ""}`} />
				</button>

				{/* Section name */}
				{isEditingName ? (
					<input
						ref={inputRef}
						value={draftName}
						onChange={(e) => setDraftName(e.target.value)}
						onBlur={commitRename}
						onKeyDown={handleNameKeyDown}
						autoFocus
						className="flex-1 min-w-0 bg-transparent cursor-text text-xs font-medium
						           text-[var(--text-primary)] outline-none border-b border-[var(--accent)]"
					/>
				) : (
					<span
						onDoubleClick={() => setIsEditingName(true)}
						className="flex-1 min-w-0 truncate text-xs cursor-text font-medium text-[var(--text-secondary)]"
					>
						{section.name}
					</span>
				)}

				{/* Count badge */}
				<span className="flex-shrink-0 text-[10px] text-[var(--text-muted)] tabular-nums">
					{sectionNodes.length}
				</span>

				{/* Delete section */}
				<button
					onClick={(e) => { e.stopPropagation(); onDelete(); }}
					className="flex-shrink-0 p-0.5 rounded text-[var(--text-muted)]
					           hover:text-[var(--text-danger)] hover:bg-[var(--bg-danger-subtle)] transition-colors"
					title="Delete section"
				>
					<XIcon size={ICON_SIZE_EXTRA_SMALL} />
				</button>
			</div>

			{/* ── Body ── */}
			{!collapsed && <SectionBody section={section} />}
		</div>
	);
}
