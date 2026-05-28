import { useDnd } from "@components/Dnd/Context";
import { DropIndicator } from "@components/Dnd/DropIndicator";
import { NodeCard } from "@components/NodeCard/NodeCard";
import { MarkedNode, NodeSection } from "@ctypes/messages";
import type { NodeSelectionState } from "@hooks/useNodeSelection";
import React from "react";

interface SectionBodyProps {
	section: NodeSection;
	sectionNodes: MarkedNode[];
	onUnmark: (nodeId: string) => void;
	onSelect: (nodeId: string) => void;
	// ── Selection + context menu ─────────────────────────────────────────────
	selection: NodeSelectionState;
	orderedNodeIds: string[];
	sections: NodeSection[];
	onMoveToSection: (nodeIds: string[], sectionId: string) => void;
	onRemoveFromSection: (nodeIds: string[], sectionId: string) => void;
}

export function SectionBody({
	section,
	sectionNodes,
	onUnmark,
	onSelect,
	selection,
	orderedNodeIds,
	sections,
	onMoveToSection,
	onRemoveFromSection,
}: SectionBodyProps) {
	const { dragging, activeDropZone, setDropZone, endDrag } = useDnd();

	const isNodeDrag = dragging?.kind === "node";

	const isDropBeforeNode = (nodeId: string) =>
		activeDropZone?.kind === "section-body" &&
		activeDropZone.sectionId === section.id &&
		activeDropZone.beforeNodeId === nodeId;

	const isDropAtEnd =
		activeDropZone?.kind === "section-body" &&
		activeDropZone.sectionId === section.id &&
		activeDropZone.beforeNodeId === null;

	return (
		<div
			className={`flex flex-col gap-1 px-2 pb-2 ${sectionNodes.length === 0 ? "pt-1" : ""}`}
			onDragOver={(e) => {
				if (!isNodeDrag) return;
				e.preventDefault();
				setDropZone({ kind: "section-body", sectionId: section.id, beforeNodeId: null });
			}}
			onDrop={(e) => { e.preventDefault(); endDrag(); }}
		>
			{sectionNodes.length === 0 && (
				<div className="flex items-center justify-center h-8 rounded border border-dashed text-[10px] text-[var(--text-muted)] transition-colors">
					Drop cards here
				</div>
			)}

			{sectionNodes.map((node, idx) => (
				<React.Fragment key={node.id}>
					{isDropBeforeNode(node.id) && <DropIndicator />}
					<NodeCard
						node={node}
						index={idx}
						onUnmark={onUnmark}
						onSelect={onSelect}
						sourceSectionId={section.id}
						onDragOverGap={(beforeNodeId) =>
							setDropZone({ kind: "section-body", sectionId: section.id, beforeNodeId })
						}
						selection={selection}
						orderedNodeIds={orderedNodeIds}
						sections={sections}
						onMoveToSection={onMoveToSection}
						onRemoveFromSection={onRemoveFromSection}
					/>
				</React.Fragment>
			))}

			{isDropAtEnd && sectionNodes.length > 0 && <DropIndicator />}
		</div>
	);
}
