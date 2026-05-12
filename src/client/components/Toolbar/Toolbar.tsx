import React, { useState } from "react";
import { countExportableRows } from "../../utils/csv";
import type { MarkedNode } from "@ctypes/messages";

interface ToolbarProps {
	nodes: MarkedNode[];
	onMarkSelection: () => void;
	onHighlightMarked: () => void;
	onClearAll: () => void;
}

export function Toolbar({ nodes, onMarkSelection, onHighlightMarked, onClearAll }: ToolbarProps): React.ReactElement {
	const [markHovered, setMarkHovered] = useState(false);
	const rowCount = countExportableRows(nodes);
	const hasNodes = nodes.length > 0;

	return (
		<>

			{/* Ghost buttons row */}
			<div style={{
				display: "flex",
				gap: 6,
				padding: "10px 12px",
				borderBottom: "1px solid var(--border)",
			}}>
				<GhostButton onClick={hasNodes ? onHighlightMarked : () => 0} disabled={!hasNodes}>Highlight Selected</GhostButton>
				<GhostButton onClick={onClearAll} danger disabled={!hasNodes}>Clear All</GhostButton>
			</div>


			<div
				style={{
					padding: "10px 12px",
					borderBottom: "1px solid var(--border)",
					display: "flex",
					flexDirection: "column",
					gap: 6,
					flexShrink: 0,
				}}
			>

				{/* Mark Selection – primary solid action */}
				<button
					onMouseEnter={() => setMarkHovered(true)}
					onMouseLeave={() => setMarkHovered(false)}
					onClick={onMarkSelection}
					style={{
						width: "100%",
						height: 34,
						borderRadius: "var(--radius-sm)",
						border: "none",
						background: markHovered ? "var(--accent-hover)" : "var(--accent)",
						color: "#0f0f11",
						fontSize: 12,
						fontWeight: 700,
						fontFamily: "var(--font)",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 6,
						transition: "background var(--transition)",
						letterSpacing: "0.01em",
					}}
				>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
						<path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
					</svg>
					Add Selection
				</button>

			</div>
		</>);
}

interface GhostButtonProps {
	onClick: () => void;
	danger?: boolean;
	disabled?: boolean;
	outlined?: boolean;
	children: React.ReactNode;
}

function GhostButton({ onClick, danger, disabled, outlined, children }: GhostButtonProps): React.ReactElement {
	const [hovered, setHovered] = useState(false);

	return (
		<button
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => !disabled && setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				flex: 1,
				height: 28,
				borderRadius: "var(--radius-sm)",
				border: `${outlined ? "1px" : "0px"} solid ${disabled ? "var(--border)" :
					hovered && danger ? "var(--danger)" :
						hovered ? "var(--border-light)" :
							"var(--border)"
					} `,
				background: hovered && !disabled
					? danger ? "var(--danger-dim)" : "var(--surface-2)"
					: "transparent",
				color: disabled ? "var(--text-muted)" :
					hovered && danger ? "var(--danger)" :
						hovered ? "var(--text-secondary)" :
							"var(--text-muted)",
				fontSize: 11,
				fontWeight: 500,
				fontFamily: "var(--font)",
				cursor: disabled ? "not-allowed" : "pointer",
				transition: "all var(--transition)",
				letterSpacing: "0.01em",
			}}
		>
			{children}
		</button>
	);
}
