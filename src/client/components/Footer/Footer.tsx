import React, { useState } from "react";
import type { MarkedNode, NodeSection, FrameTab, ExportOptions } from "@ctypes/messages";
import {
	buildTabCSVs, downloadCombinedCSV, downloadZippedCSVs,
	countExportableRows,
} from "../../utils/csv";

import { Button } from "@radix-ui/themes";
import { FileDownIcon, PlusIcon } from "lucide-react";
import { ICON_SIZE_SMALL } from "@utils/constants";


interface FooterProps {
	nodes: MarkedNode[];
	sections: NodeSection[];
	itemOrder: string[];
	tabs: FrameTab[];
	onMarkSelection: () => void;
	exportOptions: ExportOptions;
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

export function Footer({
	nodes,
	sections,
	itemOrder,
	tabs,
	onMarkSelection,
	exportOptions,
}: FooterProps): React.ReactElement {
	const [downloading, setDownloading] = useState(false);

	const rowCount = countExportableRows(nodes);
	const canDownload = rowCount > 0;
	const hasMultipleTabs = tabs.length > 1;


	const handleDownload = async () => {
		if (!canDownload || downloading) return;
		setDownloading(true);
		try {
			const tabCsvs = buildTabCSVs(nodes, sections, itemOrder, exportOptions, tabs);
			if (exportOptions.exportMode === "zip") {
				await downloadZippedCSVs(tabCsvs);
			} else {
				downloadCombinedCSV(tabCsvs, exportOptions);
			}
		} finally {
			setTimeout(() => setDownloading(false), 800);
		}
	};


	return (
		<div className="footer flex shrink-0 flex-row gap-3 justify-between border-t border-[var(--border)] px-3 pt-6 pb-6">

			<div style={{ display: "flex", gap: 12, paddingTop: 2, justifyContent: "space-between" }}>
				<Stat label="Text rows" value={rowCount} {...(canDownload ? { accent: true } : {})} />
				{hasMultipleTabs && (
					<Stat label="frames" value={tabs.length} />
				)}
			</div>

			<Button onClick={handleDownload} size="2" disabled={!canDownload}>
				{downloading
					? <><Spinner />Exporting…</>
					: <><FileDownIcon size={ICON_SIZE_SMALL} />{canDownload ? "Download CSV" : "No text to export"}</>
				}
			</Button>
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
