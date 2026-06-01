import { useDnd } from "@components/Dnd/Context";
import { DropIndicator } from "@components/Dnd/DropIndicator";
import { NodeCard } from "@components/NodeCard/NodeCard";
import { NodeSection } from "@ctypes/messages";
import React from "react";

interface SectionBodyProps {
	section: NodeSection;
}

export function SectionBody({
	section
}: SectionBodyProps) {

	const sectionNodes = section.nodeIds;

	const { dragging, activeDropZone, setDropZone, endDrag } = useDnd();

	const isNodeDrag = dragging?.kind === "nodes";

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

			{sectionNodes.map((node) => (
				<React.Fragment key={node}>
					{isDropBeforeNode(node) && <DropIndicator />}
					<NodeCard
						nodeId={node}
						sourceSectionId={section.id}
						onDragOverGap={(beforeNodeId) =>
							setDropZone({ kind: "section-body", sectionId: section.id, beforeNodeId })
						}
					/>
				</React.Fragment>
			))}

			{isDropAtEnd && sectionNodes.length > 0 && <DropIndicator />}
		</div>
	);
}
