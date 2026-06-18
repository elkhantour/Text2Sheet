import React from "react";
import { ReactNode, useState } from "react";
import { Dialog } from "@radix-ui/themes";
import { Collapsible } from "radix-ui";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { ICON_SIZE_SMALL } from "@utils/constants";

interface ISettingsSection {
	label: string;
	children?: ReactNode;
}

export function SettingsSection({ label, children }: ISettingsSection) {

	const [isOpen, setIsOpen] = useState<boolean>(false);

	const Chevron = isOpen ? ChevronUpIcon : ChevronDownIcon;

	return (<Collapsible.Root onOpenChange={setIsOpen}>
		<Collapsible.Trigger className="flex flex-row justify-between w-full">
			<Dialog.Title size="3">{label}</Dialog.Title>
			<Chevron size={ICON_SIZE_SMALL} />
		</Collapsible.Trigger>
		<Collapsible.Content>
			{children}
		</Collapsible.Content>
	</Collapsible.Root>);


}
