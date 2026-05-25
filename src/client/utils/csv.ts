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
	const rows: string[][] = [];
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

	const rows: string[][] = [];
	let isFirstLooseNode = true;

	for (const id of itemOrder) {
		const section = sectionMap.get(id);
		if (section) {
			let isFirstNodeInSection = true;
			for (const nodeId of section.nodeIds) {
				const node = nodeMap.get(nodeId);
				if (!node) continue;
				const label = isFirstNodeInSection ? section.name : "";
				rows.push(...nodeRows(node, options, label));
				isFirstNodeInSection = false;
			}
		} else {
			const node = nodeMap.get(id);
			if (!node) continue;
			rows.push(...nodeRows(node, options, isFirstLooseNode ? "Ungrouped" : ""));
			isFirstLooseNode = false;
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
		parts.push(sectionHeaderRow(tab.topFrameName, options).join(","));
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

function sectionHeaderRow(name: string, options: ExportOptions): string[] {
	const label = escapeCsvCell(name);
	return (options.includeLayerNames || options.splitBySections) ? [label, ""] : [label];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


function nodeRows(
	node: MarkedNode,
	options: ExportOptions,
	sectionLabel = "",   // only non-empty on the first row of a section block
): string[][] {
	const label = escapeCsvCell(sectionLabel);

	if (node.nodeType === "TEXT") {
		return [options.includeLayerNames
			? [label, escapeCsvCell(node.name), escapeCsvCell(node.previewText)]
			: [label, escapeCsvCell(node.previewText)]];
	}

	if (node.childTextNodes?.length) {
		return node.childTextNodes.map((child, i) =>
			options.includeLayerNames
				? [i === 0 ? label : "", escapeCsvCell(child.name), escapeCsvCell(child.content)]
				: [i === 0 ? label : "", escapeCsvCell(child.content)]
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


export function downloadCSV(csv: string, filename = `text2sheet_${today()}.csv`): void {
	triggerDownload(csv, filename);
}
