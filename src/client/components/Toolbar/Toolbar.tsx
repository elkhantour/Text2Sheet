import React, { useState } from "react";
import type { MarkedNode } from "@ctypes/messages";
import { Button } from "@radix-ui/themes";
import { PlusIcon } from "lucide-react";

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
		<>
			{/* Ghost buttons row */}
			<div className="flex gap-1.5 border-b border-[var(--border)] px-3 py-2.5">
				<Button variant="surface" onClick={hasNodes ? onHighlightMarked : () => 0} disabled={!hasNodes}>
					Highlight Selected
				</Button>

				<Button variant="surface" color="red" onClick={onClearAll} disabled={!hasNodes}>
					Clear All
				</Button>

			</div>

			{/* Primary action section */}
			<div className="flex flex-col gap-1.5 border-b border-[var(--border)] px-3 py-2.5">
				<Button onClick={onMarkSelection} > <PlusIcon /> Add Selection</Button>
			</div >
		</>
	);
}


