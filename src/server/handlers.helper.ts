import { FrameTab, MarkedNode, NodeSection, SelectionOptions } from "@ctypes/messages";
import { storeTab } from "./storage";
import { cacheResolvedTab } from "./cache";
import { sendLoading } from "./message";
import { resolveNode } from "./node";

export function findOrCreateTab(tabs: FrameTab[], tabId: string, tabName: string): FrameTab {
	return tabs.find(t => t.id === tabId) ?? {
		id: tabId,
		name: tabName,
		nodes: [],
		sections: [],
		itemOrder: [],
	};
}

export function upsertTab(tabs: FrameTab[], tab: FrameTab): FrameTab[] {
	const exists = tabs.some(t => t.id === tab.id);
	return exists ? tabs.map(t => t.id === tab.id ? tab : t) : [...tabs, tab];
}

export function matchFilter(value: string, filters: SelectionOptions["filters"]) {

	if (filters.empty && value.trim() === "") {
		return true;
	}

	if (filters.number && /^-?\d+(\.\d+)?[KMBkmb]?\+?%?$/.test(value.trim())) {
		return true;
	}

	if (filters.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
		return true;
	}

	if (filters.price && /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/.test(value.trim())) {
		return true;
	}

	if (filters.url && /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(value.trim())) {
		return true;
	}

	return false;

}

export function updateTabCacheStorage(tab: FrameTab) {
	storeTab(tab);
	cacheResolvedTab(tab.id, tab);
}



export function yieldToUI() {
	return new Promise<void>(resolve => setTimeout(resolve, 0));
}
export async function pushLoadingNotif(count: { value: number }) {
	++count.value;
	sendLoading(`Loading text ${count.value}`);
	return yieldToUI();
};


// Collect all text nodes under a node
export function collectTextNodes(node: SceneNode, filters: SelectionOptions["filters"], count: { value: number } = { value: 0 }): SceneNode[] {

	if (!node.visible) return [];

	if (node.type === "TEXT") {
		pushLoadingNotif(count);
		return [node];
	}

	if (!("findAllWithCriteria" in node)) return [];
	return node.findAllWithCriteria({ types: ["TEXT"] }).filter(n => {
		const match = n.visible && !matchFilter(n.characters, filters);

		if (match)
			pushLoadingNotif(count);

		return match;
	});
}

export function isSectionable(node: SceneNode) {
	return node.type === "GROUP" || node.type === "FRAME";
}



export async function processAutogroup(
	sel: SceneNode & { children: readonly SceneNode[] },
	tab: FrameTab,
	tabId: string,
	filters: SelectionOptions["filters"],
	addedNodeIds: string[],
	count: { value: number }
): Promise<void> {
	for (const child of sel.children) {
		if (!child.visible) continue;

		if (child.type === "TEXT") {
			const node = resolveNode(child);
			if (!tab.nodes.some(n => n.id === node.id)) {
				tab.nodes.push(node);
				if (!tab.itemOrder.includes(node.id)) tab.itemOrder.push(node.id);
				await pushLoadingNotif(count);
				addedNodeIds.push(node.id);
			}
			continue;
		}

		if (isSectionable(child)) {
			await processSectionableChild(child, tab, tabId, filters, addedNodeIds, count);
		} else {
			for (const t of collectTextNodes(child, filters)) {
				const node = resolveNode(t);
				if (!tab.nodes.some(n => n.id === node.id)) {
					tab.nodes.push(node);
					if (!tab.itemOrder.includes(node.id)) tab.itemOrder.push(node.id);
					await pushLoadingNotif(count);
					addedNodeIds.push(node.id);
				}
			}
		}
	}
}

export async function processSectionableChild(
	child: SceneNode,
	tab: FrameTab,
	tabId: string,
	filters: SelectionOptions["filters"],
	addedNodeIds: string[],
	count: { value: number },
): Promise<void> {
	const textNodes = collectTextNodes(child, filters);
	if (textNodes.length === 0) return;

	const existingSection = tab.sections.find(s => s.id === child.id);
	if (existingSection) {
		const existingIds = new Set(existingSection.nodes.map(n => n.id));
		for (const t of textNodes) {
			if (!existingIds.has(t.id)) {
				const node = resolveNode(t);
				existingSection.nodes.push(node);
				await pushLoadingNotif(count);
				addedNodeIds.push(node.id);
			}
		}
		existingSection.name = child.name;
	} else {
		const nodes: MarkedNode[] = [];
		for (const t of textNodes) {
			const node = resolveNode(t);
			nodes.push(node);
			await pushLoadingNotif(count);
		}
		const newSection: NodeSection = {
			id: child.id,
			name: child.name,
			topFrameId: tabId,
			nodes,
		};
		tab.sections.push(newSection);
		if (!tab.itemOrder.includes(child.id)) tab.itemOrder.push(child.id);
		addedNodeIds.push(...nodes.map(n => n.id));
	}
}
