import React, { BaseSyntheticEvent, useState } from "react";
import type { MarkedNode } from "@ctypes/messages";
import { buildCSV, downloadCSV, countExportableRows } from "../../utils/csv";
import Checkbox from "@components/Checkbox/Checkbox";
import "./Footer.scss";

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

			<span className="text-[12px] text-[var(--text-muted)]">
				{label}
			</span>
		</div>
	);
}

export function Footer({ nodes }: FooterProps): React.ReactElement {
	const [downloading, setDownloading] = useState(false);
	const [includeLayerName, setIncludeLayerName] = useState(false);

	const rowCount = countExportableRows(nodes);
	const canDownload = rowCount > 0;

	const handleDownload = () => {
		if (!canDownload || downloading) return;

		setDownloading(true);
		try {
			const csv = buildCSV(nodes, includeLayerName);
			const filename = `text2sheet_${new Date().toISOString().slice(0, 10)}.csv`;
			downloadCSV(csv, filename);
		} finally {
			setTimeout(() => setDownloading(false), 800);
		}
	};

	return (
		<div className="footer flex shrink-0 flex-col gap-3 border-t border-[var(--border)] px-3 pt-6 pb-6">
			<button
				onClick={handleDownload}
				disabled={!canDownload}
				data-download={canDownload}
				className={`footer-download ${canDownload ? "enabled" : "disabled"}`}>
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
				<Checkbox
					label="Include layer names"
					className="text-[var(--text-muted)]"
					onChange={(e: BaseSyntheticEvent) => { setIncludeLayerName(e.target.checked); }}
				/>
				<Stat label="Text rows" value={rowCount} {...(canDownload ? { accent: true } : {})} />
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
