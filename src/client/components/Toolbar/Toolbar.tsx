import React from "react";
import { Button } from "@radix-ui/themes";
import { GroupIcon, PlusIcon, SquareDashedMousePointerIcon } from "lucide-react";
import { ICON_SIZE_SMALL } from "@utils/constants";
import { usePlugin } from "@contexts/usePlugin";
import { useNodeSelection } from "@contexts/useNodeSelection";
import { ToggleLabel } from "@components/ToggleLabel/ToggleLabel";
import { Settings } from "./Settings";

export function Toolbar(): React.ReactElement {

	const {
		markSelection,
		selectionOptions,
		saveSelectionOptions,
	} = usePlugin();

	const { toggleLinkSelection } = useNodeSelection();

	return (
		<div className="flex justify-between w-full px-3 py-3 items-center">

			<Button onClick={markSelection} size="2"> <PlusIcon size={ICON_SIZE_SMALL} /> Add Selection </Button>

			<div className="flex flex-row gap-4">

				<ToggleLabel
					icon={GroupIcon}
					label="Auto Group"
					pressed={selectionOptions.autogroup}
					onPressedChange={() => {
						saveSelectionOptions({ ...selectionOptions, autogroup: !selectionOptions.autogroup });
					}}
				/>
				<ToggleLabel
					icon={SquareDashedMousePointerIcon}
					label="Sync Selection"
					pressed={selectionOptions.sync}
					onPressedChange={() => {
						toggleLinkSelection();
						saveSelectionOptions({ ...selectionOptions, sync: !selectionOptions.sync });
					}}
				/>
				<Settings />
			</div>
		</div>
	);
}



