import { FrameTab } from "@ctypes/messages";


const RESOLVED_TABS: {
	map: Map<string, FrameTab>,
	array: FrameTab[],
} = {
	map: new Map(),
	array: []
}

function updateTabsArray() {
	RESOLVED_TABS.array = [...RESOLVED_TABS.map.values()];
}


export function getCacheResolvedTabs() {
	return RESOLVED_TABS.map;
}

export function getCacheResolvedTabsArray() {
	return RESOLVED_TABS.array;
}

export function getCacheResolvedTab(id: string) {
	return RESOLVED_TABS.map.get(id);
}

export function cacheResolvedTab(id: string, tab: FrameTab) {
	RESOLVED_TABS.map.set(id, tab);
	updateTabsArray();
}

export function deleteCacheResolvedTab(id: string) {
	RESOLVED_TABS.map.delete(id);
	updateTabsArray();
}

export function clearCacheResolvedTab() {
	RESOLVED_TABS.map = new Map();
	RESOLVED_TABS.array = [];
}
