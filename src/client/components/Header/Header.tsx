import React from "react";

export function Header(): React.ReactElement {
	return (
		<header
			className="
				flex
				shrink-0
				items-center
				justify-between
				border-b
				border-[var(--border)]
				px-4
				py-[14px]
			"
		>
			<div className="flex items-center gap-2">
				<div
					className="
						flex
						h-7
						w-7
						shrink-0
						items-center
						justify-center
						rounded-lg
						bg-gradient-to-br
						from-[var(--accent)]
						to-emerald-400
					"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path
							d="M2 4h12M2 8h8M2 12h5"
							stroke="#0f0f11"
							strokeWidth="1.8"
							strokeLinecap="round"
						/>
						<rect
							x="11"
							y="9"
							width="4"
							height="4"
							rx="1"
							fill="#0f0f11"
							opacity="0.7"
						/>
					</svg>
				</div>

				<span
					className="
						text-sm
						font-bold
						tracking-[-0.02em]
						text-[var(--text-primary)]
					"
				>
					Text2Sheet
				</span>
			</div>
		</header>
	);
}
