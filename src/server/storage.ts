import { DEFAULT_EXPORT_OPTIONS, DEFAULT_SELECTION_OPTIONS } from "../lib/constants";
import { EXPORT_OPTIONS_KEY, ITEM_ORDER_KEY, SECTIONS_KEY, SELECTION_OPTIONS_KEY, STORAGE_KEY } from "./constants";
import type { NodeSection, ExportOptions, SelectionOptions } from "@ctypes/messages";

// ─── Node IDs ─────────────────────────────────────────────────────────────────
export function getStoredIds(): string[] {
	const raw = JSON.parse(figma.root.getPluginData(STORAGE_KEY) || "[]");
	if (Array.isArray(raw)) return raw as string[];
	return [];
}
export function saveIds(ids: string[]): void {
	figma.root.setPluginData(STORAGE_KEY, JSON.stringify(ids));
}

// ─── Sections ─────────────────────────────────────────────────────────────────
export function getSections(): NodeSection[] {
	const raw = JSON.parse(figma.root.getPluginData(SECTIONS_KEY) || "[]");
	if (Array.isArray(raw)) return raw as NodeSection[];
	return [];
}
export function saveSections(sections: NodeSection[]): void {
	figma.root.setPluginData(SECTIONS_KEY, JSON.stringify(sections));
}

// ─── Item order ───────────────────────────────────────────────────────────────
export function getItemOrder(): string[] {
	const raw = JSON.parse(figma.root.getPluginData(ITEM_ORDER_KEY) || "[]");
	if (Array.isArray(raw)) return raw as string[];
	return [];
}
export function saveItemOrder(order: string[]): void {
	figma.root.setPluginData(ITEM_ORDER_KEY, JSON.stringify(order));
}

// ─── Options ───────────────────────────────────────────────────────────
export function getExportOptions(): ExportOptions {
	const raw = JSON.parse(figma.root.getPluginData(EXPORT_OPTIONS_KEY) || "{}");
	if (raw && typeof raw === "object") return { ...DEFAULT_EXPORT_OPTIONS, ...(raw as Partial<ExportOptions>) };
	return { ...DEFAULT_EXPORT_OPTIONS };
}

export function saveExportOptions(options: ExportOptions): void {
	figma.root.setPluginData(EXPORT_OPTIONS_KEY, JSON.stringify(options));
}

export function saveSelectionOptions(options: SelectionOptions): void {
	figma.root.setPluginData(SELECTION_OPTIONS_KEY, JSON.stringify(options));
}

export function getSelectionOptions(): SelectionOptions {
	const raw = JSON.parse(figma.root.getPluginData(SELECTION_OPTIONS_KEY) || "{}");
	if (raw && typeof raw === "object") return { ...DEFAULT_SELECTION_OPTIONS, ...(raw as Partial<SelectionOptions>) };
	return { ...DEFAULT_SELECTION_OPTIONS };
}
