import React, { useState } from "react";
import { Button, Text } from "@radix-ui/themes";
import { FileDownIcon } from "lucide-react";
import { ICON_SIZE_SMALL } from "@utils/constants";
import { Spinner } from "./Spinner";
import { export2File } from "@utils/exports/manager";
import { usePlugin } from "@contexts/usePlugin";


function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
	return (
		<div className="flex items-baseline gap-1">
			<Text size="2" className={`font-bold leading-none font-[var(--font)] ${accent ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
				{value}
			</Text>
			<Text size="1" className={`${accent ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>{label}</Text>
		</div>
	);
}

export function Footer(): React.ReactElement {

	const {
		tabs,
		exportOptions,
		activeTab,
		globalStats,
	} = usePlugin();



	const [downloading, setDownloading] = useState(false);

	const canDownload = globalStats.rowsCount > 0;

	const handleDownload = async () => {
		if (!canDownload || downloading || !activeTab) return;
		setDownloading(true);

		await export2File({ tabs, exportOptions });
		setTimeout(() => setDownloading(false), 800);
	};

	const fileExtension = exportOptions.exportMode.format === "csv" ? "CSV" : "Excel";

	return (
		<div className="footer flex shrink-0 flex-row gap-3 items-center justify-between border-t border-[var(--border)] px-3 pt-6 pb-6">

			<div className="flex justify-between gap-3 pt-0.5">
				<Stat label="Rows" value={globalStats.rowsCount} {...(canDownload ? { accent: true } : {})} />

				<Stat label="Pages" value={globalStats.pagesCount} {...(canDownload ? { accent: true } : {})} />

			</div>

			<Button onClick={handleDownload} size="2" disabled={!canDownload}>
				{downloading
					? <><Spinner />Exporting…</>
					: <><FileDownIcon size={ICON_SIZE_SMALL} />{canDownload ? `Download ${fileExtension}` : "No text to export"}</>
				}
			</Button>
		</div>
	);
}

