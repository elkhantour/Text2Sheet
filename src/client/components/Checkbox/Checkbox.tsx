import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

interface CheckboxProps {
	label?: string;
	onChange: (state: CheckboxPrimitive.CheckedState) => void
	className?: string;
	checked?: boolean;
}

export default function Checkbox({
	label,
	onChange,
	className = "",
	checked,
	...props
}: CheckboxProps) {
	return (
		<label className={`flex cursor-pointer items-center gap-2 ${className}`}>
			<CheckboxPrimitive.Root
				checked={checked}
				onCheckedChange={onChange}
				className="
					flex
					h-4
					w-4
					items-center
					justify-center
					rounded
					border
					border-[var(--border-light)]
					bg-[var(--surface)]
					transition-colors
					data-[state=checked]:border-[var(--accent)]
					data-[state=checked]:bg-[var(--accent)]
				"
				{...props}
			>
				<CheckboxPrimitive.Indicator
					className="text-[#0f0f11]"
				>
					✓
				</CheckboxPrimitive.Indicator>
			</CheckboxPrimitive.Root>

			{label && (
				<span className="text-sm text-[var(--text-primary)]">
					{label}
				</span>
			)}
		</label>
	);
}
