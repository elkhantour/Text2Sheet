import React from "react";
import type { FrameTab } from "@ctypes/messages";

interface FrameTabsProps {
  tabs: FrameTab[];
  activeTabId: string | null;
  onSelect: (topFrameId: string) => void;
}

export function FrameTabs({ tabs, activeTabId, onSelect }: FrameTabsProps): React.ReactElement | null {
  if (tabs.length === 0) return null;

  return (
    <div className="flex shrink-0 items-end gap-0 border-b border-[var(--border)] px-3 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.topFrameId === activeTabId;
        return (
          <button
            key={tab.topFrameId}
            onClick={() => onSelect(tab.topFrameId)}
            data-active={isActive}
            className="
              relative shrink-0 px-3 py-2 text-xs font-medium transition-colors
              text-[var(--text-muted)] hover:text-[var(--text-secondary)]
              data-[active=true]:text-[var(--text-primary)]
              whitespace-nowrap
            "
          >
            {tab.topFrameName}
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
