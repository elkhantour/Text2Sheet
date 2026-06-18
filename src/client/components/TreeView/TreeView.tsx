import { usePlugin } from "@contexts/usePlugin";
import { TreeNode } from "@ctypes/messages";
import { ChevronDown } from "lucide-react";
import { Collapsible } from "radix-ui";
import React, { ComponentPropsWithRef, useState } from "react";
import { hasActiveChildren } from "./Helper";

interface TreeNodeProps {
	node: TreeNode;
	depth: number;
	activeTabId?: string;
	setActiveTab: (tabId: string) => void;
}

const LABEL_STYLE = `
group
w-full flex items-center justify-between
px-2 py-1 rounded
text-sm transition-colors text-gray-500
hover:text-green-100
data-[active=true]:text-green-100
data-[active=true]:bg-green-600/20
`;

function TreeNodeComponent({
	node,
	depth,
	activeTabId,
	setActiveTab,
}: TreeNodeProps) {
	const hasChildren = node.children && node.children.length > 0;
	const isActive = node.tab?.id === activeTabId;
	const [isOpen, setIsOpen] = useState(false);


	return (
		<div className="pl-2 mb-2">
			{hasChildren ? (
				<Collapsible.Root key={node.id} className="w-full" onOpenChange={setIsOpen}>
					<Collapsible.Trigger asChild>
						<div className={LABEL_STYLE}>
							<button
								data-active={isActive}
								onClick={() => node.tab && setActiveTab(node.tab.id)}
								className="flex flex-row gap-2 items-center"
							>
								<span>{node.name}</span>
								{activeTabId && !isOpen && hasActiveChildren(node, activeTabId) && <span className="w-2 h-2 block rounded-xs bg-green-400/30" />}
							</button>
							<ChevronDown data-open={isOpen} className="h-4 w-4 transition-transform data-[open=true]:rotate-[-180deg]" />
						</div>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div className="ml-2 border-l border-gray-800">
							{node.children!.map(child => (
								<TreeNodeComponent
									key={child.id}
									node={child}
									depth={depth + 1}
									activeTabId={activeTabId}
									setActiveTab={setActiveTab}
								/>
							))}
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			) : (
				<button
					onClick={() => node.tab && setActiveTab(node.tab.id)}
					data-active={isActive}
					className={LABEL_STYLE}
				>
					<span>{node.name}</span>
				</button>
			)}
		</div>
	);
}



export default function TreeView({ className }: ComponentPropsWithRef<"div">) {

	const { tree, activeTab, setActiveTab } = usePlugin();

	return (
		<div
			className={`text-sm font-sans overflow-y-auto ${className}`}
			style={{ scrollbarWidth: 'thin' }}
		>
			{tree.map(node => (
				<TreeNodeComponent
					key={node.id}
					node={node}
					depth={0}
					activeTabId={activeTab?.id}
					setActiveTab={setActiveTab}
				/>
			))}
		</div>
	);
}
