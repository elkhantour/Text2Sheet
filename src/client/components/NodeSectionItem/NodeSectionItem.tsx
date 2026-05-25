import React, { useState, useRef } from "react";
import type { MarkedNode, NodeSection } from "@ctypes/messages";
import { useDnd } from "@components/Dnd/Context";
import { SectionBody } from "./SectionBody";

interface NodeSectionItemProps {
	section: NodeSection;
	nodeMap: Map<string, MarkedNode>;
	onUnmark: (nodeId: string) => void;
	onSelect: (nodeId: string) => void;
	onDelete: () => void;
	onRename: (name: string) => void;
}

export function NodeSectionItem({
	section,
	nodeMap,
	onUnmark,
	onSelect,
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
		(activeDropZone?.kind === "section-header" || activeDropZone?.kind === "section-body") && activeDropZone.sectionId === section.id;

	const sectionNodes = section.nodeIds
		.map((id) => nodeMap.get(id))
		.filter(Boolean) as MarkedNode[];

	// ── Section drag (header handle) ─────────────────────────────────────────

	const handleHeaderDragStart = (e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = "move";
		startDrag({ kind: "section", sectionId: section.id });
	};

	const handleHeaderDragEnd = () => endDrag();

	// ── Section header as drop target (append card) ───────────────────────────

	const handleHeaderDragOver = (e: React.DragEvent) => {
		if (dragging?.kind !== "node") return;
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

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div
			className={`rounded-md border transition-all ${isDraggingThis
					? "opacity-40"
					: isHeaderDropTarget
						? "border-[var(--accent)] bg-[var(--accent-subtle)]"
						: "border-[var(--border-light)] bg-[var(--bg-secondary)]"
				}`}
		>
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
				{/* Drag handle */}
				<svg
					width="12" height="12" viewBox="0 0 12 12" fill="none"
					className="flex-shrink-0 text-[var(--text-muted)]"
				>
					<circle cx="4" cy="3" r="1" fill="currentColor" />
					<circle cx="8" cy="3" r="1" fill="currentColor" />
					<circle cx="4" cy="6" r="1" fill="currentColor" />
					<circle cx="8" cy="6" r="1" fill="currentColor" />
					<circle cx="4" cy="9" r="1" fill="currentColor" />
					<circle cx="8" cy="9" r="1" fill="currentColor" />
				</svg>

				{/* Collapse chevron */}
				<button
					onClick={() => setCollapsed((c) => !c)}
					className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
				>
					<svg
						width="12" height="12" viewBox="0 0 12 12" fill="none"
						className={`transition-transform ${collapsed ? "-rotate-90" : ""}`}
					>
						<path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
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
						className="flex-1 min-w-0 bg-transparent cursor-text text-xs font-medium text-[var(--text-primary)]
						           outline-none border-b border-[var(--accent)]"
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
					className="flex-shrink-0 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-danger)]
					           hover:bg-[var(--bg-danger-subtle)] transition-colors"
					title="Delete section"
				>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
						<path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
					</svg>
				</button>
			</div>

			{/* ── Body (cards) ── */}
			{!collapsed && (
				<SectionBody
					section={section}
					sectionNodes={sectionNodes}
					onUnmark={onUnmark}
					onSelect={onSelect}
				/>
			)}
		</div>
	);
}

