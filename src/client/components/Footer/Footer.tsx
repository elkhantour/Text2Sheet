import React, { useState } from "react";
import type { MarkedNode } from "@ctypes/messages";
import { buildCSV, downloadCSV, countExportableRows } from "../../utils/csv";

interface FooterProps {
	nodes: MarkedNode[];
}

function Stat({
	label,
	value,
	accent,
}: {
	label: string;
	value: number;
	accent?: boolean;
}) {
	return (
		<div className="flex items-baseline gap-1">
			<span
				className={`text-[16px] font-bold leading-none font-[var(--font)] ${accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
					}`}
			>
				{value}
			</span>

			<span className="text-[11px] text-[var(--text-muted)]">
				{label}
			</span>
		</div>
	);
}

export function Footer({ nodes }: FooterProps): React.ReactElement {
	const [hovered, setHovered] = useState(false);
	const [downloading, setDownloading] = useState(false);

	const rowCount = countExportableRows(nodes);
	const canDownload = rowCount > 0;
	const hasNodes = nodes.length > 0;

	const handleDownload = () => {
		if (!canDownload || downloading) return;

		setDownloading(true);
		try {
			const csv = buildCSV(nodes);
			const filename = `text2sheet_${new Date().toISOString().slice(0, 10)}.csv`;
			downloadCSV(csv, filename);
		} finally {
			setTimeout(() => setDownloading(false), 800);
		}
	};

	return (
		<div className="flex shrink-0 flex-col gap-1.5 border-t border-[var(--border)] px-3 pt-2.5 pb-6">
			<button
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				onClick={handleDownload}
				disabled={!canDownload}
				className={`
  w-full h-10 rounded-[var(--radius-md)]
  flex items-center justify-center gap-2
  text-[13px] font-semibold font-[var(--font)]
  tracking-[0.01em]
  transition-all duration-200
  ${canDownload ? "cursor-pointer" : "cursor-not-allowed"}
  ${canDownload
						? hovered
							? "border border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
							: "border border-[var(--border-light)] bg-[var(--surface-2)] text-[var(--text-secondary)]"
						: "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
					}
`}
			>
				{downloading ? (
					<>
						<Spinner />
						Exporting…
					</>
				) : (
					<>
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
							<path
								d="M7 1v8M4 6l3 3 3-3M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						{canDownload ? "Download CSV" : "No text to export"}
					</>
				)}
			</button>

			{/* Stats row */}
			<div style={{ display: "flex", gap: 12, paddingTop: 2, justifyContent: "space-between" }}>
				<div>
				</div>
				<Stat label="Text rows" value={rowCount} accent />
			</div>


		</div>
	);
}

function Spinner(): React.ReactElement {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			style={{ animation: "spin 0.8s linear infinite" }}
		>
			<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
			<circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 10" />
		</svg>
	);
}
