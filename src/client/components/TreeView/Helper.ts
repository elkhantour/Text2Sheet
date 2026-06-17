import { TreeNode } from "@ctypes/messages";

export function hasActiveChildren(node: TreeNode, activeTab: string): boolean {
	if (!node) return false;

	if (node.tab?.id === activeTab) return true;

	if (!node.children?.length) return false;

	return node.children.some(child =>
		hasActiveChildren(child, activeTab)
	);
}
