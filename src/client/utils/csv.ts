import type { MarkedNode, NodeSection, FrameTab, ExportOptions } from "@ctypes/messages";
import JSZip from "jszip";


// ─── Per-tab CSV builder ──────────────────────────────────────────────────────

/**
	* Returns one CSV string per tab. The caller decides whether to combine or zip.
	*/
export function buildTabCSVs(
	nodes: MarkedNode[],
	sections: NodeSection[],
	itemOrder: string[],
	options: ExportOptions,
	tabs: FrameTab[],
): Array<{ tab: FrameTab; csv: string }> {
	return tabs.map((tab) => {
		const tabNodes = nodes.filter((n) => n.topFrameId === tab.topFrameId);
		const tabSections = sections.filter((s) => s.topFrameId === tab.topFrameId);
		const tabNodeIds = new Set(tabNodes.map((n) => n.id));
		const tabSectionIds = new Set(tabSections.map((s) => s.id));
		const tabOrder = itemOrder.filter((id) => tabNodeIds.has(id) || tabSectionIds.has(id));

		const csv = options.splitBySections && tabSections.length > 0
			? buildSectionedCSV(tabNodes, tabSections, tabOrder, options)
			: buildFlatCSV(tabNodes, options);

		return { tab, csv };
	});
}

// ─── Flat ─────────────────────────────────────────────────────────────────────

function buildFlatCSV(nodes: MarkedNode[], options: ExportOptions): string {
	const rows: string[][] = [headerRow(options)];
	for (const node of nodes) rows.push(...nodeRows(node, options));
	return serialize(rows);
}

// ─── Sectioned ────────────────────────────────────────────────────────────────

function buildSectionedCSV(
	nodes: MarkedNode[],
	sections: NodeSection[],
	itemOrder: string[],
	options: ExportOptions,
): string {
	const nodeMap = new Map(nodes.map((n) => [n.id, n]));
	const sectionMap = new Map(sections.map((s) => [s.id, s]));

	const rows: string[][] = [headerRow(options)];
	let firstBlock = true;

	for (const id of itemOrder) {
		const section = sectionMap.get(id);
		if (section) {
			if (!firstBlock) rows.push([]);
			rows.push(sectionHeaderRow(section.name, options));
			for (const nodeId of section.nodeIds) {
				const node = nodeMap.get(nodeId);
				if (node) rows.push(...nodeRows(node, options));
			}
			firstBlock = false;
		} else {
			const node = nodeMap.get(id);
			if (!node) continue;
			if (!firstBlock) rows.push([]);
			rows.push(...nodeRows(node, options));
			firstBlock = false;
		}
	}

	return serialize(rows);
}

// ─── Download ─────────────────────────────────────────────────────────────────

/**
	* Combined mode: all tabs separated by a blank row + "=== Tab Name ===" header.
	*/
export function downloadCombinedCSV(
	tabCsvs: Array<{ tab: FrameTab; csv: string }>,
	options: ExportOptions,
	filename = `text2sheet_${today()}.csv`,
): void {
	const parts: string[] = [];
	for (const { tab, csv } of tabCsvs) {
		if (parts.length > 0) parts.push(""); // blank row between tabs
		parts.push(`=== ${tab.topFrameName} ===`);
		parts.push(csv);
	}
	triggerDownload(parts.join("\r\n"), filename);
}

/**
	* Zip mode: one CSV per tab, bundled into a .zip using JSZip loaded from CDN.
	* Falls back to combined if JSZip is unavailable.
	*/
export async function downloadZippedCSVs(
	tabCsvs: Array<{ tab: FrameTab; csv: string }>,
	baseFilename = `text2sheet_${today()}`,
): Promise<void> {

	if (!JSZip) {
		console.warn("JSZip not found, falling back to combined CSV.");
		downloadCombinedCSV(tabCsvs, { includeLayerNames: false, splitBySections: false, exportMode: "combined" });
		return;
	}

	const zip = new JSZip();
	const bom = "\uFEFF";

	for (const { tab, csv } of tabCsvs) {
		const safeName = tab.topFrameName.replace(/[\\/:*?"<>|]/g, "_");
		zip.file(`${safeName}.csv`, bom + csv);
	}

	const blob = await zip.generateAsync({ type: "blob" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${baseFilename}.zip`;
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function headerRow(options: ExportOptions): string[] {
	return options.includeLayerNames ? ["Layer Name", "Text Content"] : ["Text Content"];
}

function sectionHeaderRow(name: string, options: ExportOptions): string[] {
	const label = escapeCsvCell(`=== ${name} ===`);
	return options.includeLayerNames ? [label, ""] : [label];
}

function nodeRows(node: MarkedNode, options: ExportOptions): string[][] {
	if (node.nodeType === "TEXT") {
		return [options.includeLayerNames
			? [escapeCsvCell(node.name), escapeCsvCell(node.previewText)]
			: [escapeCsvCell(node.previewText)]];
	}
	if (node.childTextNodes?.length) {
		return node.childTextNodes.map((child) =>
			options.includeLayerNames
				? [escapeCsvCell(child.name), escapeCsvCell(child.content)]
				: [escapeCsvCell(child.content)]
		);
	}
	return [];
}

function serialize(rows: string[][]): string {
	return rows.map((row) => row.join(",")).join("\r\n");
}

function escapeCsvCell(value: string): string {
	if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
	return value;
}

function triggerDownload(content: string, filename: string): void {
	const bom = "\uFEFF";
	const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
}

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

export function countExportableRows(nodes: MarkedNode[]): number {
	let count = 0;
	for (const node of nodes) {
		if (node.nodeType === "TEXT") count += 1;
		else if (node.childTextNodes) count += node.childTextNodes.length;
	}
	return count;
}

// Legacy shim
export function buildCSV(
	nodes: MarkedNode[],
	options: ExportOptions,
	sections?: NodeSection[],
	itemOrder?: string[],
): string {
	if (options.splitBySections && sections?.length && itemOrder) {
		const tabSections = sections;
		const tabOrder = itemOrder;
		return buildSectionedCSV(nodes, tabSections, tabOrder, options);
	}
	return buildFlatCSV(nodes, options);
}

export function downloadCSV(csv: string, filename = `text2sheet_${today()}.csv`): void {
	triggerDownload(csv, filename);
}
