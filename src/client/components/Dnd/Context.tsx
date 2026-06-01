import { createContext, useContext } from "react";

// ─── Drag item descriptors ────────────────────────────────────────────────────

export type DragItem =
	| { kind: "nodes"; nodeIds: string[]; sourceSectionId: string | null }
	| { kind: "section"; sectionId: string };

// ─── Drop zone descriptors ────────────────────────────────────────────────────

export type DropZone =
	// Drop onto the loose area between top-level items (insert before `beforeId`, or append if null)
	| { kind: "top-level"; beforeId: string | null }
	// Drop onto a section header → append to that section
	| { kind: "section-header"; sectionId: string }
	// Drop between cards inside a section
	| { kind: "section-body"; sectionId: string; beforeNodeId: string | null };

// ─── Context ──────────────────────────────────────────────────────────────────

interface DndContextValue {
	dragging: DragItem | null;
	activeDropZone: DropZone | null;
	startDrag: (item: DragItem) => void;
	setDropZone: (zone: DropZone | null) => void;
	endDrag: () => void;
}

export const DndContext = createContext<DndContextValue>({
	dragging: null,
	activeDropZone: null,
	startDrag: () => {},
	setDropZone: () => {},
	endDrag: () => {},
});

export function useDnd() {
	return useContext(DndContext);
}
