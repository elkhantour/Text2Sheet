import React, { useState } from "react";
import { countExportableRows } from "../../utils/csv";
import type { MarkedNode } from "@ctypes/messages";

interface ToolbarProps {
	nodes: MarkedNode[];
	onMarkSelection: () => void;
	onHighlightMarked: () => void;
	onClearAll: () => void;
}

export function Toolbar({
	nodes,
	onMarkSelection,
	onHighlightMarked,
	onClearAll,
}: ToolbarProps): React.ReactElement {
	const rowCount = countExportableRows(nodes);
	const hasNodes = nodes.length > 0;

	return (
		<>
			{/* Ghost buttons row */}
			<div className="flex gap-1.5 border-b border-[var(--border)] px-3 py-2.5">
				<GhostButton
					onClick={hasNodes ? onHighlightMarked : () => 0}
					disabled={!hasNodes}
				>
					Highlight Selected
				</GhostButton>

				<GhostButton onClick={onClearAll} danger disabled={!hasNodes}>
					Clear All
				</GhostButton>
			</div>

			{/* Primary action section */}
			<div className="flex flex-col gap-1.5 border-b border-[var(--border)] px-3 py-2.5">
				<button
					onClick={onMarkSelection}
					className="
						group
						flex
						h-[34px]
						w-full
						items-center
						justify-center
						gap-1.5
						rounded-sm
						bg-[var(--accent)]
						font-semibold
						text-[12px]
						text-[#0f0f11]
						tracking-[0.01em]
						transition-colors
						hover:bg-[var(--accent-hover)]
					"
				>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
						<path
							d="M6 1v10M1 6h10"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
					Add Selection
				</button>
			</div>
		</>
	);
}


interface GhostButtonProps {
	onClick: () => void;
	danger?: boolean;
	disabled?: boolean;
	outlined?: boolean;
	children: React.ReactNode;
}

function GhostButton({
	onClick,
	danger,
	disabled,
	outlined,
	children,
}: GhostButtonProps): React.ReactElement {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			data-danger={danger || undefined}
			data-outlined={outlined || undefined}
			className="
				flex
				h-7
				flex-1
				items-center
				justify-center
				rounded-sm
				border
				bg-transparent
				font-medium
				text-[11px]
				tracking-[0.01em]
				transition-all

				cursor-pointer
				text-[var(--text-muted)]
				border-[var(--border)]

				hover:bg-[var(--surface-2)]
				hover:text-[var(--text-secondary)]
				hover:border-[var(--border-light)]

				data-[danger=true]:hover:bg-[var(--danger-dim)]
				data-[danger=true]:hover:text-[var(--danger)]
				data-[danger=true]:hover:border-[var(--danger)]

				data-[disabled=true]:cursor-not-allowed
				data-[disabled=true]:opacity-50
				data-[disabled=true]:hover:bg-transparent
				data-[disabled=true]:hover:text-[var(--text-muted)]
				data-[disabled=true]:hover:border-[var(--border)]

				data-[outlined=false]:border-0
			"
		>
			{children}
		</button>
	);
}
