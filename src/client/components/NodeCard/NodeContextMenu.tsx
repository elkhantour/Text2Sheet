import React, { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import type { NodeSection } from "@ctypes/messages";

interface NodeContextMenuProps {
	children: React.ReactNode;
	nodeId: string;
	sourceSectionId: string | null;
	selectedIds: Set<string>;
	sections: NodeSection[];
	onUnmark: (nodeId: string) => void;
	onMoveToSection: (sectionId: string) => void;
	onRemoveFromSection: () => void;
}

export function NodeContextMenu({
	children,
	nodeId,
	sourceSectionId,
	selectedIds,
	sections,
	onUnmark,
	onMoveToSection,
	onRemoveFromSection,
}: NodeContextMenuProps): React.ReactElement {
	const [addToSectionOpen, setAddToSectionOpen] = useState(false);

	// The set of nodes this action applies to:
	// if right-clicked node is in selection → whole selection, else just this node
	const affectedIds = selectedIds.has(nodeId) ? selectedIds : new Set([nodeId]);
	const count = affectedIds.size;
	const label = count > 1 ? `${count} nodes` : "node";

	return (
		<>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild>
					{children}
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content
						className="
							z-50 min-w-[180px] rounded-lg border border-[var(--border-light)]
							bg-[var(--surface-2)] p-1 shadow-xl
							animate-in fade-in-0 zoom-in-95
						"
						sideOffset={4}
						align="start"
					>
						{/* Delete */}
						<DropdownMenu.Item
							onSelect={() => {
								for (const id of affectedIds) onUnmark(id);
							}}
							className="
								flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5
								text-xs text-[var(--danger)] outline-none
								hover:bg-[var(--danger-dim)]
								focus:bg-[var(--danger-dim)]
							"
						>
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
								<path d="M1.5 3h9M4.5 3V1.5h3V3M5 5.5v4M7 5.5v4M2 3l.5 7.5h7L10 3"
									stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							Remove {label}
						</DropdownMenu.Item>

						<DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />

						{/* Add to section */}
						<DropdownMenu.Item
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
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
								<rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
								<path d="M6 4v4M4 6h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
							</svg>
							Add to section…
						</DropdownMenu.Item>

						{/* Remove from section */}
						{sourceSectionId && (
							<DropdownMenu.Item
								onSelect={onRemoveFromSection}
								className="
									flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5
									text-xs text-[var(--text-secondary)] outline-none
									hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]
									focus:bg-[var(--surface-3)]
								"
							>
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
									<rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
									<path d="M3.5 6h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
								</svg>
								Remove from section
							</DropdownMenu.Item>
						)}
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			{/* Add to section modal */}
			<AddToSectionDialog
				open={addToSectionOpen}
				onOpenChange={setAddToSectionOpen}
				sections={sections}
				count={count}
				onConfirm={(sectionId) => {
					onMoveToSection(sectionId);
					setAddToSectionOpen(false);
				}}
			/>
		</>
	);
}

// ─── Add to section dialog ────────────────────────────────────────────────────

interface AddToSectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sections: NodeSection[];
	count: number;
	onConfirm: (sectionId: string) => void;
}

function AddToSectionDialog({
	open,
	onOpenChange,
	sections,
	count,
	onConfirm,
}: AddToSectionDialogProps): React.ReactElement {
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
						{sections.map((section) => (
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
								<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
									<rect x="0.5" y="0.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1" />
								</svg>
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
