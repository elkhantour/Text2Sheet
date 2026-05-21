import React, { BaseSyntheticEvent, useState } from "react";
import type { MarkedNode } from "@ctypes/messages";
import { buildCSV, downloadCSV, countExportableRows } from "../../utils/csv";
import Checkbox from "@components/Checkbox/Checkbox";
import { Button, Dialog } from "@radix-ui/themes";
import { FileDownIcon, SettingsIcon } from "lucide-react";

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
			<div className="flex flex-row rounded-sm overflow-hidden w-fit">
				<Button
					onClick={handleDownload}
					disabled={!canDownload}
					radius="none"
				>
					{downloading ? (
						<>
							<Spinner />
							Exporting…
						</>
					) : (
						<>
							<FileDownIcon />
							{canDownload ? "Download CSV" : "No text to export"}
						</>
					)}
				</Button>
				<span className="w-[1px] h-full block bg-emerald-500"></span>
				<Dialog.Root>
					<Dialog.Trigger>
						<Button radius="none">
							<SettingsIcon />
						</Button>
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Title>Export settings</Dialog.Title>
						<Checkbox
							label="Include layer names"
							className="text-[var(--text-muted)]"
							onChange={(e: BaseSyntheticEvent) => { setIncludeLayerName(e.target.checked); }}
						/>
					</Dialog.Content>
				</Dialog.Root>

			</div>

			{/* Stats row */}
			<div style={{ display: "flex", gap: 12, paddingTop: 2, justifyContent: "space-between" }}>

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
