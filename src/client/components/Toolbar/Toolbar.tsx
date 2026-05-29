import React from "react";
import type { ExportOptions } from "@ctypes/messages";
import { Button, Dialog, SegmentedControl, Text, Separator } from "@radix-ui/themes";
import { CheckboxStateToBool } from "@components/Checkbox/Utils";
import Checkbox from "@components/Checkbox/Checkbox";
import { PlusIcon, SettingsIcon } from "lucide-react";
import { ICON_SIZE_SMALL } from "@utils/constants";
import { usePlugin } from "@hooks/usePlugin";
import { useTabs } from "@hooks/useTabs";


export function Toolbar(): React.ReactElement {

	const {
		markedNodes,
		clearAll,
		markSelection,
		saveExportOptions,
		exportOptions,
		sections,
		itemOrder,
	} = usePlugin();

	const {
		tabs
	} = useTabs(markedNodes, sections, itemOrder);

	const hasNodes = markedNodes.length > 0;
	const setOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) =>
		saveExportOptions({ ...exportOptions, [key]: value });

	const hasMultipleTabs = tabs.length > 1;

	return (
		<div className="flex justify-between w-full px-3 py-3 items-center">

			<Button onClick={markSelection} size="2"> <PlusIcon size={ICON_SIZE_SMALL} /> Add Selection</Button>

			<Dialog.Root>
				<Dialog.Trigger>
					<Button size="1" variant="ghost"><SettingsIcon size={ICON_SIZE_SMALL} /></Button>
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

						{/* Format Export (XLS / CSV)*/}
						<SegmentedControl.Root
							defaultValue={exportOptions.exportMode.format}
							onValueChange={(v) => setOption("exportMode", {
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
									onValueChange={(v) => setOption("exportMode", {
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

						<Separator size="4" />

						<div className="p-4 bg-red-950 border border-red-800 flex flex-col gap-4 justify-center rounded-md">
							<Text color="red" size="1" ><b>Danger Zone</b></Text>
							<Button color="red" onClick={hasNodes ? clearAll : undefined} disabled={!hasNodes}>Clear All</Button>

						</div>
					</div>
				</Dialog.Content>
			</Dialog.Root>

		</div>
	);
}


