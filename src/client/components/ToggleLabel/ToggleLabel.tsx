import React from "react";
import { useState } from "react";
import { LucideIcon } from "lucide-react";
import { Toggle } from "@radix-ui/react-toggle";
import { ICON_SIZE_SMALL } from "@utils/constants";
import clsx from "clsx";

interface IconToggleProps {
	icon: LucideIcon;
	label: string;
	iconSize?: string;
	defaultPressed?: boolean;
	pressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	className?: string;
}

export function ToggleLabel({
	icon: Icon,
	label,
	iconSize = ICON_SIZE_SMALL,
	defaultPressed = false,
	pressed,
	onPressedChange,
	className,
}: IconToggleProps) {
	const [internalPressed, setInternalPressed] = useState(defaultPressed);

	// Support both controlled and uncontrolled usage
	const isPressed = pressed !== undefined ? pressed : internalPressed;

	const handlePressedChange = (next: boolean) => {
		if (pressed === undefined) {
			setInternalPressed(next);
		}
		onPressedChange?.(next);
	};

	return (
		<Toggle
			aria-label={`Toggle ${label.toLowerCase()}`}
			title={`Toggle ${label.toLowerCase()}`}
			pressed={isPressed}
			className={clsx(`
                        text-gray-500
                        text-[11px]
                        flex
                        flex-row
                        gap-1
                        items-center
                        text-[var(--text-muted)]
                        data-[active=true]:text-[var(--accent)]
                        hover:text-[var(--accent-7)]`, className)}
			onPressedChange={handlePressedChange}
			data-active={isPressed}
		>
			<Icon size={iconSize} data-active={isPressed} />
			<span data-active={isPressed}>{label}</span>
		</Toggle>
	);
}
