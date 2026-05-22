import React from "react";

export function EmptyState(): React.ReactElement {
	return (
		<div className="flex flex-1 flex-col items-center justify-center p-8 text-center gap-3 text-[var(--text-muted)]">
			<svg width="40" height="40" viewBox="0 0 40 40" fill="none">
				<rect x="4" y="4" width="14" height="14" rx="3" stroke="var(--border-light)" strokeWidth="1.5" />
				<rect x="22" y="4" width="14" height="14" rx="3" stroke="var(--border-light)" strokeWidth="1.5" />
				<rect x="4" y="22" width="14" height="14" rx="3" stroke="var(--border-light)" strokeWidth="1.5" />
				<rect x="22" y="22" width="14" height="14" rx="3" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 2" />
				<path d="M27 29h4M29 27v4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
			</svg>
			<div>
				<p className="mb-1 text-[13px] font-semibold text-[var(--text-secondary)]">No layers marked</p>
				<p className="text-xs leading-relaxed">
					Select layers in the canvas,
					<br />
					then click <strong className="text-[var(--text-secondary)]">Add Selection</strong>
				</p>
			</div>
		</div>
	);
}
