import type { MarkedNode, NodeSection, FrameTab, ExportOptions } from "@ctypes/messages";
import JSZip from "jszip";
import { today, sanitizeFilename, triggerDownload } from "@utils/exports/commons";

// ─── Per-tab CSV builder ──────────────────────────────────────────────────────

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

		const csv = options.splitBySections
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

	const rows: string[][] = [headerRow(options)];
	let isFirstLooseNode = true;

	for (const id of itemOrder) {
		const section = sectionMap.get(id);
		if (section) {
			let isFirstNodeInSection = true;
			for (const nodeId of section.nodeIds) {
				const node = nodeMap.get(nodeId);
				if (!node) continue;
				rows.push(...nodeRows(node, options, isFirstNodeInSection ? section.name : ""));
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

export function downloadCombinedCSV(
	tabCsvs: Array<{ tab: FrameTab; csv: string }>,
	options: ExportOptions,
	filename = `text2sheet_${today()}.csv`,
): void {
	const parts: string[] = [];
	for (const { tab, csv } of tabCsvs) {
		if (parts.length > 0) parts.push("");
		parts.push(sectionHeaderRow(tab.topFrameName, options).join(","));
		parts.push(csv);
	}
	triggerDownload(parts.join("\r\n"), filename);
}

export async function downloadZippedCSVs(
	tabCsvs: Array<{ tab: FrameTab; csv: string }>,
	baseFilename = `text2sheet_${today()}`,
): Promise<void> {
	if (!JSZip) {
		console.warn("JSZip not found, falling back to combined CSV.");
		downloadCombinedCSV(tabCsvs, {
			includeLayerNames: false,
			splitBySections: false,
			exportMode: { format: "csv", structure: "combined" },
		});
		return;
	}

	const zip = new JSZip();
	const bom = "\uFEFF";

	for (const { tab, csv } of tabCsvs) {
		zip.file(`${sanitizeFilename(tab.topFrameName)}.csv`, bom + csv);
	}

	const blob = await zip.generateAsync({ type: "blob" });
	triggerDownload(blob, `${baseFilename}.zip`);
}

export function downloadCSV(csv: string, filename = `text2sheet_${today()}.csv`): void {
	triggerDownload(csv, filename);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function headerRow(options: ExportOptions): string[] {
	if (options.splitBySections && options.includeLayerNames) return ["Section", "Layer Name", "Text Content"];
	if (options.splitBySections) return ["Section", "Text Content"];
	if (options.includeLayerNames) return ["Layer Name", "Text Content"];
	return ["Text Content"];
}

function sectionHeaderRow(name: string, options: ExportOptions): string[] {
	const label = escapeCsvCell(name);
	return (options.includeLayerNames || options.splitBySections) ? [label, ""] : [label];
}

function nodeRows(
	node: MarkedNode,
	options: ExportOptions,
	sectionLabel = "",
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
