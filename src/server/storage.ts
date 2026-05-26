import { DEFAULT_EXPORT_OPTIONS } from "../lib/constants";
import { STORAGE_KEY } from "./constants";
import type { NodeSection, ExportOptions } from "@ctypes/messages";

const SECTIONS_KEY = "sections";
const ITEM_ORDER_KEY = "itemOrder";
const EXPORT_OPTIONS_KEY = "exportOptions";

// ─── Node IDs ─────────────────────────────────────────────────────────────────

export async function getStoredIds(): Promise<string[]> {
	const raw = await figma.clientStorage.getAsync(STORAGE_KEY);
	if (Array.isArray(raw)) return raw as string[];
	return [];
}

export async function saveIds(ids: string[]): Promise<void> {
	await figma.clientStorage.setAsync(STORAGE_KEY, ids);
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export async function getSections(): Promise<NodeSection[]> {
	const raw = await figma.clientStorage.getAsync(SECTIONS_KEY);
	if (Array.isArray(raw)) return raw as NodeSection[];
	return [];
}

export async function saveSections(sections: NodeSection[]): Promise<void> {
	await figma.clientStorage.setAsync(SECTIONS_KEY, sections);
}

// ─── Item order ───────────────────────────────────────────────────────────────

export async function getItemOrder(): Promise<string[]> {
	const raw = await figma.clientStorage.getAsync(ITEM_ORDER_KEY);
	if (Array.isArray(raw)) return raw as string[];
	return [];
}

export async function saveItemOrder(order: string[]): Promise<void> {
	await figma.clientStorage.setAsync(ITEM_ORDER_KEY, order);
}

// ─── Export options ───────────────────────────────────────────────────────────

export async function getExportOptions(): Promise<ExportOptions> {
	const raw = await figma.clientStorage.getAsync(EXPORT_OPTIONS_KEY);
	if (raw && typeof raw === "object") return { ...DEFAULT_EXPORT_OPTIONS, ...(raw as Partial<ExportOptions>) };
	return { ...DEFAULT_EXPORT_OPTIONS };
}

export async function saveExportOptions(options: ExportOptions): Promise<void> {
	await figma.clientStorage.setAsync(EXPORT_OPTIONS_KEY, options);
}
