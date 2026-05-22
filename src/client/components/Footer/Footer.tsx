import React from "react";
import type { ExportOptions, MarkedNode, NodeSection } from "@ctypes/messages";
import { buildCSV, downloadCSV, countExportableRows } from "../../utils/csv";
import Checkbox from "@components/Checkbox/Checkbox";
import { Button, Dialog } from "@radix-ui/themes";
import { FileDownIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";

interface FooterProps {
	nodes: MarkedNode[];
	sections: NodeSection[];
	itemOrder: string[];
	exportOptions: ExportOptions;
	onSaveExportOptions: (options: ExportOptions) => void;
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
	return (
		<div className="flex items-baseline gap-1">
			<span className={`text-[16px] font-bold leading-none font-[var(--font)] ${accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
				{value}
			</span>
			<span className="text-[12px] text-[var(--text-muted)]">{label}</span>
		</div>
	);
}

export function Footer({ nodes, sections, itemOrder, exportOptions, onSaveExportOptions }: FooterProps): React.ReactElement {
	const [downloading, setDownloading] = useState(false);
	const rowCount = countExportableRows(nodes);
	const canDownload = rowCount > 0;

	const setOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) =>
		onSaveExportOptions({ ...exportOptions, [key]: value });

	const handleDownload = () => {
		if (!canDownload || downloading) return;
		setDownloading(true);
		try {
			const csv = buildCSV(nodes, exportOptions, sections, itemOrder);
			const filename = `text2sheet_${new Date().toISOString().slice(0, 10)}.csv`;
			downloadCSV(csv, filename);
		} finally {
			setTimeout(() => setDownloading(false), 800);
		}
	};

	return (
		<div className="footer flex shrink-0 flex-row justify-between items-center gap-3 border-t border-[var(--border)] px-3 pt-6 pb-6">

			<Stat label="Text rows" value={rowCount} {...(canDownload ? { accent: true } : {})} />

			<div className="flex flex-row rounded-sm overflow-hidden w-fit">
				<Button onClick={handleDownload} disabled={!canDownload} radius="none">
					{downloading
						? <><Spinner />Exporting…</>
						: <><FileDownIcon />{canDownload ? "Download CSV" : "No text to export"}</>
					}
				</Button>
				<span className="w-[1px] h-full block bg-emerald-500" />
				<Dialog.Root>
					<Dialog.Trigger>
						<Button radius="none"><SettingsIcon /></Button>
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Title>Export settings</Dialog.Title>
						<div className="flex flex-col gap-3 mt-2">

							<Checkbox
								label="Include layer names"
								className="text-[var(--text-muted)]"
								checked={exportOptions.includeLayerNames}
								onChange={(e) => setOption("includeLayerNames", e != 'indeterminate' ? e : false)}
							/>

							<Checkbox
								label="Split by sections"
								className="text-[var(--text-muted)]"
								checked={exportOptions.splitBySections}
								onChange={(e) => setOption("splitBySections", e != 'indeterminate' ? e : false)}
							/>

							{/* Reserved — not implemented yet */}
							<Checkbox
								label="Split by frame"
								className="text-[var(--text-muted)] opacity-40"
								checked={false}
								onChange={() => {}}
							/>

						</div>
					</Dialog.Content>
				</Dialog.Root>
			</div>

		</div>
	);
}

function Spinner(): React.ReactElement {
	return (
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
			<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
			<circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 10" />
		</svg>
	);
}
