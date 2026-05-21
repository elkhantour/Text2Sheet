import React from "react";

/**
 * A thin horizontal line shown where a dragged item will be dropped.
 */
export function DropIndicator(): React.ReactElement {
	return (
		<div className="relative flex items-center h-0.5 my-0.5 mx-1 pointer-events-none">
			<div className="absolute left-0 w-2 h-2 -translate-y-[3px] rounded-full bg-[var(--accent)]" />
			<div className="flex-1 h-[1.5px] bg-[var(--accent)] ml-2" />
		</div>
	);
}
