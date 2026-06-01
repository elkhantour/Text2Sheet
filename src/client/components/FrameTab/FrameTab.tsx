import React from "react";
import { Text } from "@radix-ui/themes";
import { usePlugin } from "@hooks/usePlugin";
import { useTabs } from "@contexts/useTabs";
import { useNodeSelection } from "@contexts/useNodeSelection";

export function FrameTabs(): React.ReactElement | null {

	const { selectNode } = usePlugin();
	const { tabs, activeTabId, setActiveTabId } = useTabs();
	const selection = useNodeSelection();

	if (tabs.length === 0) return null;

	return (
		<div className="flex shrink-0 items-end gap-0 border-b border-[var(--border)] px-3 overflow-x-auto">
			{tabs.map((tab) => {
				const isActive = tab.topFrameId === activeTabId;
				return (
					<button
						key={tab.topFrameId}
						onClick={() => {
							setActiveTabId(tab.topFrameId);
							selection.clearSelection();
						}}
						onDoubleClick={() => selectNode(tab.topFrameId)}
						data-active={isActive}
						className="
              relative shrink-0 px-3 py-2 font-medium transition-colors
              text-[var(--text-muted)] hover:text-[var(--text-secondary)]
              data-[active=true]:text-[var(--text-primary)]
              whitespace-nowrap
            "
					>
						<Text size="2">{tab.topFrameName}</Text>
						{/* Active underline */}
						{isActive && (
							<span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)] rounded-t-full" />
						)}
					</button>
				);
			})}
		</div>
	);
}
