import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  kind: "error" | "success" | "info";
  onDismiss: () => void;
}

export function Toast({ message, kind, onDismiss }: ToastProps): React.ReactElement {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		requestAnimationFrame(() => setVisible(true));
	}, []);

	return (
		<div
			onClick={onDismiss}
			data-visible={visible}
			data-kind={kind}
			className="
				absolute
				bottom-[120px]
				left-3
				right-3
				z-50
				flex
				cursor-pointer
				items-center
				gap-2
				rounded-md
				border
				p-2.5
				text-xs
				leading-relaxed
				opacity-0
				translate-y-2
				transition-all
				duration-200

				data-[visible=true]:opacity-100
				data-[visible=true]:translate-y-0

				data-[kind=error]:bg-[var(--danger-dim)]
				data-[kind=error]:border-[var(--danger)]
				data-[kind=error]:text-[var(--danger)]

				data-[kind=success]:bg-[var(--accent-dim)]
				data-[kind=success]:border-[var(--accent)]
				data-[kind=success]:text-[var(--accent)]

				data-[kind=info]:bg-[var(--surface-2)]
				data-[kind=info]:border-[var(--border-light)]
				data-[kind=info]:text-[var(--text-secondary)]
			"
		>
			<span
				className="
					flex
					h-[18px]
					w-[18px]
					shrink-0
					items-center
					justify-center
					rounded-full
					border
					border-current
					text-[10px]
					font-bold
				"
			>
				{kind === "error" ? "✕" : kind === "success" ? "✓" : "i"}
			</span>

			<span>{message}</span>
		</div>
	);
}
