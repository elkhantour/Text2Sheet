import React, { ComponentPropsWithoutRef } from "react";

interface ICheckboxProps extends ComponentPropsWithoutRef<"div"> {
	label?: string;
};

export default function Checkbox({
	label = "Accept terms",
	onChange,
	className,
}: ICheckboxProps) {
	return (
		<label className={`flex items-center gap-2 cursor-pointer ${className}`}>
			<input
				type="checkbox"
				onChange={onChange}
				className="w-4 h-4"
			/>
			<span>{label}</span>
		</label>
	);
}
