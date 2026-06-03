import React, { useCallback, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { NodeSection } from "@ctypes/messages";
import { useNodeSelection } from "@contexts/useNodeSelection";
import { ContextMenu } from "@radix-ui/themes";
import { usePlugin } from "@hooks/usePlugin";
import { MinusSquareIcon, PlusSquareIcon, TrashIcon } from "lucide-react";
import { ICON_SIZE_SMALL } from "@utils/constants";
import { useTabs } from "@contexts/useTabs";

interface NodeContextMenuProps {
	children: React.ReactNode;
}

export function NodeContextMenu({
	children,
}: NodeContextMenuProps): React.ReactElement {

	const [addToSectionOpen, setAddToSectionOpen] = useState(false);

	const {
		unmarkNodes,
		sections,
		moveNodesToSection,
		getSectionFromId,
	} = usePlugin();

	const selection = useNodeSelection();

	// TODO unify string[] and Set<string> for node Ids
	const handleMoveToSection = useCallback((nodeIds: Set<string>, sectionId: string) => {
		const target = getSectionFromId(sectionId);
		if (!target) return;
		moveNodesToSection(Array.from(nodeIds), sectionId, target.nodeIds.length);
		selection.clearSelection();
	}, [sections, moveNodesToSection, selection]);

	const handleRemoveFromSection = useCallback((nodeIds: Set<string>) => {
		moveNodesToSection(Array.from(nodeIds), null, 0);
		selection.clearSelection();
	}, [moveNodesToSection, selection]);

	const handleUnmarkNodes = () => {
		unmarkNodes(Array.from(selection.selectedIds));
		selection.clearSelection();
	}

	// The set of nodes this action applies to:
	// if right-clicked node is in selection → whole selection, else just this node
	//const affectedIds = selectedIds.has(nodeId) ? selectedIds : new Set([nodeId]);
	const count = selection.selectedIds.size;
	const label = count > 1 ? `${count} nodes` : "node";

	return (
		<>
			<ContextMenu.Root>
				<ContextMenu.Trigger>
					{children}
				</ContextMenu.Trigger>
				<ContextMenu.Content className="z-50 min-w-[180px] rounded-lg border border-[var(--border-light)] bg-[var(--surface-2)] p-1 shadow-xl animate-in fade-in-0 zoom-in-95">

					{/* Add to section */}
					<ContextMenu.Item
						onSelect={() => setAddToSectionOpen(true)}
						disabled={sections.length === 0}
						className="
								flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5
								text-xs text-[var(--text-secondary)] outline-none
								hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]
								focus:bg-[var(--surface-3)]
								data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40
							"
					>
						<PlusSquareIcon size={ICON_SIZE_SMALL} />
						Add to section…
					</ContextMenu.Item>

					{/* Remove from section */}
					{<ContextMenu.Item
						onSelect={() => handleRemoveFromSection(selection.selectedIds)}
						className="
									flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5
									text-xs text-[var(--text-secondary)] outline-none
									hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]
									focus:bg-[var(--surface-3)]
								"
					>
						<MinusSquareIcon size={ICON_SIZE_SMALL} />
						Remove from section
					</ContextMenu.Item>
					}

					<ContextMenu.Separator className="my-1 h-px bg-[var(--border)]" />

					{/* Delete */}
					<ContextMenu.Item
						onSelect={handleUnmarkNodes}
						className="
								flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5
								text-xs text-[var(--danger)] outline-none
								hover:bg-[var(--danger-dim)]
								focus:bg-[var(--danger-dim)]
							"
					>
						<TrashIcon size={ICON_SIZE_SMALL} />
						Remove {label}
					</ContextMenu.Item>

				</ContextMenu.Content>
			</ContextMenu.Root >

			{/* Add to section modal */}
			<AddToSectionDialog
				open={addToSectionOpen}
				onOpenChange={setAddToSectionOpen}
				count={count}
				onConfirm={(sectionId) => {
					handleMoveToSection(selection.selectedIds, sectionId);
					setAddToSectionOpen(false);
				}
				}
			/>
		</>
	);
}

// ─── Add to section dialog ────────────────────────────────────────────────────

interface AddToSectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	count: number;
	onConfirm: (sectionId: string) => void;
}

function AddToSectionDialog({
	open,
	onOpenChange,
	count,
	onConfirm,
}: AddToSectionDialogProps): React.ReactElement {

	const { activeSections } = useTabs();

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0" />
				<Dialog.Content
					className="
						fixed left-1/2 top-1/2 z-50 w-[280px]
						-translate-x-1/2 -translate-y-1/2
						rounded-xl border border-[var(--border-light)]
						bg-[var(--surface-2)] p-4 shadow-2xl
						animate-in fade-in-0 zoom-in-95
					"
				>
					<Dialog.Title className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
						Add to section
					</Dialog.Title>
					<Dialog.Description className="mb-3 text-xs text-[var(--text-muted)]">
						Move {count > 1 ? `${count} nodes` : "1 node"} to:
					</Dialog.Description>

					<div className="flex flex-col gap-1">
						{activeSections.map((section) => (
							<button
								key={section.id}
								onClick={() => onConfirm(section.id)}
								className="
									flex items-center gap-2 rounded-lg border border-[var(--border)]
									bg-[var(--surface)] px-3 py-2 text-left text-xs
									text-[var(--text-secondary)] transition-all
									hover:border-[var(--accent)] hover:bg-[var(--accent-dim)]
									hover:text-[var(--text-primary)]
								"
							>
								{section.name}
								<span className="ml-auto text-[10px] text-[var(--text-muted)]">
									{section.nodeIds.length}
								</span>
							</button>
						))}
					</div>

					<div className="mt-3 flex justify-end">
						<Dialog.Close asChild>
							<button className="
								rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)]
								hover:bg-[var(--surface-3)] hover:text-[var(--text-secondary)]
								transition-colors
							">
								Cancel
							</button>
						</Dialog.Close>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
