import React from "react";
import type { ExportOptions, SelectionOptions } from "@ctypes/messages";
import { Button, Dialog, SegmentedControl, Separator, Text } from "@radix-ui/themes";
import { CheckboxStateToBool } from "@components/Checkbox/Utils";
import Checkbox from "@components/Checkbox/Checkbox";
import { SettingsIcon } from "lucide-react";
import { ICON_SIZE_SMALL } from "@utils/constants";
import { usePlugin } from "@contexts/usePlugin";
import { SettingsSection } from "./SettingsSection";

const FILTERS_LABELS: Array<{ key: keyof SelectionOptions["filters"], label: string }> = [
	{ key: "number", label: "Numbers" },
	{ key: "email", label: "Emails" },
	{ key: "price", label: "Prices" },
	{ key: "empty", label: "Empty Texts" },
	{ key: "url", label: "URLs" },
];

export function Settings() {

	const {
		clearAll,
		saveExportOptions,
		saveSelectionOptions,
		exportOptions,
		selectionOptions,
		tabs,
		activeTab,
	} = usePlugin();

	const hasNodes = activeTab ? activeTab.nodes.length > 0 : false;

	const setExportOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) =>
		saveExportOptions({ ...exportOptions, [key]: value });

	const setSelectionFilter = <K extends keyof SelectionOptions["filters"]>(key: K, value: SelectionOptions["filters"][K]) =>
		saveSelectionOptions({
			...selectionOptions,
			filters: {
				...selectionOptions.filters,
				[key]: value,
			}
		});

	const hasMultipleTabs = tabs.length > 1;

	return (<Dialog.Root>
		<Dialog.Trigger>
			<Button size="1" variant="ghost"><SettingsIcon size={ICON_SIZE_SMALL} /></Button>
		</Dialog.Trigger>

		<Dialog.Content className="max-h-[300px] max-w-[120px]">

			{/* SELECTION SETTINGS */}
			<SettingsSection label="Selection settings">

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Text size="1" ><b>Include</b></Text>
						{FILTERS_LABELS.map(({ key, label }) => <Checkbox
							key={key}
							label={label}
							checked={!selectionOptions.filters[key]}
							className="text-[var(--text-muted)]"
							onChange={(e) => setSelectionFilter(key, !CheckboxStateToBool(e))}
						/>)}
					</div>

					<div className="p-4 bg-red-950 border border-red-800 flex flex-col gap-4 justify-center rounded-md">
						<Text color="red" size="1" ><b>Danger Zone</b></Text>
						<Button color="red"
							onClick={(hasNodes || activeTab?.sections.length) ? clearAll : undefined}
							disabled={!hasNodes && !activeTab?.sections.length}>
							Clear All
						</Button>

					</div>
				</div>
			</SettingsSection>

			<Separator size="4" className="my-4" />

			{/* EXPORTS SETTINGS */}
			<SettingsSection label="Export settings">
				<div className="flex flex-col gap-4 mt-2">

					<Checkbox
						label="Include layer names"
						checked={exportOptions.includeLayerNames}
						className="text-[var(--text-muted)]"
						onChange={(e) => setExportOption("includeLayerNames", CheckboxStateToBool(e))}
					/>

					<Checkbox
						label="Split by sections"
						checked={exportOptions.splitBySections}
						className="text-[var(--text-muted)]"
						onChange={(e) => setExportOption("splitBySections", CheckboxStateToBool(e))}
					/>

					{/* Format Export (XLS / CSV)*/}
					<SegmentedControl.Root
						defaultValue={exportOptions.exportMode.format}
						onValueChange={(v) => setExportOption("exportMode", {
							...exportOptions.exportMode,
							format: v as ExportOptions["exportMode"]["format"],
						})}
						size="1"
					>
						<SegmentedControl.Item value="xls">Excel</SegmentedControl.Item>
						<SegmentedControl.Item value="csv">CSV</SegmentedControl.Item>
					</SegmentedControl.Root>

					{/* Export mode — only relevant when there are multiple tabs and if file format is CSV */}

					{exportOptions.exportMode.format === "csv" &&
						<div className={`flex flex-col gap-2 ${!hasMultipleTabs ? "opacity-40 pointer-events-none" : ""}`}>
							<span className="text-xs">
								Export format
								{!hasMultipleTabs && <span className="ml-1 opacity-60">(multiple frames needed)</span>}
							</span>
							<SegmentedControl.Root
								defaultValue={exportOptions.exportMode.structure}
								onValueChange={(v) => setExportOption("exportMode", {
									...exportOptions.exportMode,
									structure: v as ExportOptions["exportMode"]["structure"],
								})}
								size="1"
							>
								<SegmentedControl.Item value="combined">Combined CSV</SegmentedControl.Item>
								<SegmentedControl.Item value="zip">ZIP (one per frame)</SegmentedControl.Item>
							</SegmentedControl.Root>
						</div>
					}

				</div>


			</SettingsSection>


		</Dialog.Content>
	</Dialog.Root >
	);


}
