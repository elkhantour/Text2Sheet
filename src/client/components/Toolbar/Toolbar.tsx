import React from "react";
import type { ExportOptions, FrameTab, MarkedNode } from "@ctypes/messages";
import { Button, DropdownMenu, Dialog, SegmentedControl, Text, Separator } from "@radix-ui/themes";
import { CheckboxStateToBool } from "@components/Checkbox/Utils";
import Checkbox from "@components/Checkbox/Checkbox";
import { PlusIcon, SettingsIcon } from "lucide-react";
import { ICON_SIZE_SMALL } from "@utils/constants";


interface ToolbarProps {
	nodes: MarkedNode[];
	onClearAll: () => void;
	exportOptions: ExportOptions;
	onMarkSelection: () => void;
	onSaveExportOptions: (options: ExportOptions) => void;
	tabs: FrameTab[];
}

export function Toolbar({
	nodes,
	onClearAll,
	exportOptions,
	onMarkSelection,
	onSaveExportOptions,
	tabs,
}: ToolbarProps): React.ReactElement {

	const hasNodes = nodes.length > 0;
	const setOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) =>
		onSaveExportOptions({ ...exportOptions, [key]: value });

	const hasMultipleTabs = tabs.length > 1;

	return (
		<div className="flex justify-between w-full px-3 py-3 items-center">

			<Button onClick={onMarkSelection} size="2"> <PlusIcon size={ICON_SIZE_SMALL} /> Add Selection</Button>

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

						{/* Export mode — only relevant when there are multiple tabs */}
						<div className={`flex flex-col gap-2 ${!hasMultipleTabs ? "opacity-40 pointer-events-none" : ""}`}>
							<span className="text-xs">
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

						<Separator size="4" />

						<div className="p-4 bg-red-950 border border-red-800 flex flex-col gap-4 justify-center rounded-md">
							<Text color="red" size="1" ><b>Danger Zone</b></Text>
							<Button color="red" onClick={hasNodes ? onClearAll : undefined} disabled={!hasNodes}>Clear All</Button>

						</div>
					</div>
				</Dialog.Content>
			</Dialog.Root>

		</div>
	);
}


