import React, { useState } from "react";
import type { MarkedNode } from "@ctypes/messages";
import { Button, DropdownMenu } from "@radix-ui/themes";
import { EllipsisVerticalIcon, PlusIcon } from "lucide-react";

interface ToolbarProps {
	nodes: MarkedNode[];
	onMarkSelection: () => void;
	onHighlightMarked: () => void;
	onClearAll: () => void;
}

export function Toolbar({
	nodes,
	onMarkSelection,
	onHighlightMarked,
	onClearAll,
}: ToolbarProps): React.ReactElement {
	const hasNodes = nodes.length > 0;

	return (
		<div className="flex justify-between w-full px-3 py-3 items-center">
			{/* Primary action */}
			<Button onClick={onMarkSelection} > <PlusIcon /> Add Selection</Button>

			<DropdownMenu.Root>

				<DropdownMenu.Trigger>
					<Button variant="ghost">
						<EllipsisVerticalIcon />
					</Button>
				</DropdownMenu.Trigger>

				<DropdownMenu.Content>
					<DropdownMenu.Item color="red" onClick={hasNodes ? onClearAll : undefined} disabled={!hasNodes}>
						Clear All
					</DropdownMenu.Item>
				</DropdownMenu.Content>

			</DropdownMenu.Root>

		</div>
	);
}


