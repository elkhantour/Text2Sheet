import React, { useState } from "react";
import type { MarkedNode, NodeSection, FrameTab, ExportOptions } from "@ctypes/messages";
import {
	buildTabCSVs, downloadCombinedCSV, downloadZippedCSVs,
	countExportableRows,
} from "../../utils/csv";
import Checkbox from "@components/Checkbox/Checkbox";
import { Button, Dialog, SegmentedControl } from "@radix-ui/themes";
import { FileDownIcon, SettingsIcon } from "lucide-react";
import { CheckboxStateToBool } from "@components/Checkbox/Utils";

interface FooterProps {
	nodes: MarkedNode[];
	sections: NodeSection[];
	itemOrder: string[];
	tabs: FrameTab[];
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

export function Footer({ nodes, sections, itemOrder, tabs, exportOptions, onSaveExportOptions }: FooterProps): React.ReactElement {
	const [downloading, setDownloading] = useState(false);

	const rowCount = countExportableRows(nodes);
	const canDownload = rowCount > 0;
	const hasSections = sections.length > 0;
	const hasMultipleTabs = tabs.length > 1;

	const setOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) =>
		onSaveExportOptions({ ...exportOptions, [key]: value });

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
		<div className="footer flex shrink-0 flex-col gap-3 border-t border-[var(--border)] px-3 pt-6 pb-6">
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
						<div className="flex flex-col gap-4 mt-2">

							<Checkbox
								label="Include layer names"
								checked={exportOptions.includeLayerNames}
								className="text-[var(--text-muted)]"
								onChange={(e) => setOption("includeLayerNames", CheckboxStateToBool(e))}
							/>

							<Checkbox
								label="Split by sections"
								checked={exportOptions.splitBySections}
								className="text-[var(--text-muted)]"
								onChange={(e) => setOption("splitBySections", CheckboxStateToBool(e))}
							/>

							{/* Export mode — only relevant when there are multiple tabs */}
							<div className={`flex flex-col gap-2 ${!hasMultipleTabs ? "opacity-40 pointer-events-none" : ""}`}>
								<span className="text-xs text-[var(--text-muted)]">
									Export format
									{!hasMultipleTabs && <span className="ml-1 opacity-60">(multiple frames needed)</span>}
								</span>
								<SegmentedControl.Root
									value={exportOptions.exportMode}
									onValueChange={(v) => setOption("exportMode", v as ExportOptions["exportMode"])}
									size="1"
								>
									<SegmentedControl.Item value="combined">Combined CSV</SegmentedControl.Item>
									<SegmentedControl.Item value="zip">ZIP (one per frame)</SegmentedControl.Item>
								</SegmentedControl.Root>
							</div>

						</div>
					</Dialog.Content>
				</Dialog.Root>
			</div>

			<div style={{ display: "flex", gap: 12, paddingTop: 2, justifyContent: "space-between" }}>
				<Stat label="Text rows" value={rowCount} {...(canDownload ? { accent: true } : {})} />
				{hasMultipleTabs && (
					<Stat label="frames" value={tabs.length} />
				)}
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
