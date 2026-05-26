import ExcelJS from "exceljs";
import type { MarkedNode, NodeSection, FrameTab, ExportOptions } from "@ctypes/messages";
import { today, sanitizeFilename, triggerDownload } from "@utils/exports/commons";

// ─── Theme ────────────────────────────────────────────────────────────────────

const COLOR = {
	headerBg: "FF1A1A1F",       // dark surface
	headerFg: "FF6EE7B7",       // accent green
	sectionBg: "FFE8F5E9",      // light green tint
	sectionFg: "FF1B5E20",      // dark green
	ungroupedBg: "FFF5F5F5",    // light grey
	ungroupedFg: "FF555555",
	rowAltBg: "FFFAFAFA",
	borderColor: "FFD0D0D0",
} as const;

const FONT_NAME = "Calibri";

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Builds and downloads a .xlsx workbook.
 * Each FrameTab becomes one sheet.
 * Structure is always "combined" (multi-sheet workbook) for XLS exports.
 */
export async function downloadXLS(
	nodes: MarkedNode[],
	sections: NodeSection[],
	itemOrder: string[],
	options: ExportOptions,
	tabs: FrameTab[],
	filename = `text2sheet_${today()}.xlsx`,
): Promise<void> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = "Text2Sheet";
	workbook.created = new Date();

	for (const tab of tabs) {
		const tabNodes = nodes.filter((n) => n.topFrameId === tab.topFrameId);
		const tabSections = sections.filter((s) => s.topFrameId === tab.topFrameId);
		const tabNodeIds = new Set(tabNodes.map((n) => n.id));
		const tabSectionIds = new Set(tabSections.map((s) => s.id));
		const tabOrder = itemOrder.filter((id) => tabNodeIds.has(id) || tabSectionIds.has(id));

		const sheetName = sanitizeFilename(tab.topFrameName).slice(0, 31); // Excel sheet name limit
		const sheet = workbook.addWorksheet(sheetName);

		buildSheet(sheet, tabNodes, tabSections, tabOrder, options);
	}

	const buffer = await workbook.xlsx.writeBuffer();
	triggerDownload(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

// ─── Sheet builder ────────────────────────────────────────────────────────────

function buildSheet(
	sheet: ExcelJS.Worksheet,
	nodes: MarkedNode[],
	sections: NodeSection[],
	itemOrder: string[],
	options: ExportOptions,
): void {
	const colCount = options.includeLayerNames ? 3 : 2; // Section | (Layer Name) | Text Content

	// Column widths
	sheet.getColumn(1).width = 24; // Section
	if (options.includeLayerNames) {
		sheet.getColumn(2).width = 28; // Layer Name
		sheet.getColumn(3).width = 48; // Text Content
	} else {
		sheet.getColumn(2).width = 48; // Text Content
	}

	// Freeze header row
	sheet.views = [{ state: "frozen", ySplit: 1 }];

	// ── Header row ────────────────────────────────────────────────────────────
	const headers = options.includeLayerNames
		? ["Section", "Layer Name", "Text Content"]
		: ["Section", "Text Content"];

	const headerRow = sheet.addRow(headers);
	headerRow.eachCell((cell) => {
		cell.font = { name: FONT_NAME, bold: true, color: { argb: COLOR.headerFg }, size: 11 };
		cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.headerBg } };
		cell.alignment = { vertical: "middle", horizontal: "left" };
		cell.border = { bottom: { style: "thin", color: { argb: COLOR.borderColor } } };
	});
	headerRow.height = 22;

	// ── Body ──────────────────────────────────────────────────────────────────
	if (options.splitBySections) {
		buildSectionedSheet(sheet, nodes, sections, itemOrder, options, colCount);
	} else {
		buildFlatSheet(sheet, nodes, options);
	}

	// Auto-filter on header
	sheet.autoFilter = {
		from: { row: 1, column: 1 },
		to: { row: 1, column: colCount },
	};
}

// ─── Flat sheet ───────────────────────────────────────────────────────────────

function buildFlatSheet(
	sheet: ExcelJS.Worksheet,
	nodes: MarkedNode[],
	options: ExportOptions,
): void {
	let rowIndex = 2;
	for (const node of nodes) {
		const dataRows = resolveNodeRows(node, options);
		for (const data of dataRows) {
			const row = sheet.addRow(data);
			applyDataRowStyle(row, rowIndex);
			rowIndex++;
		}
	}
}

// ─── Sectioned sheet ──────────────────────────────────────────────────────────

function buildSectionedSheet(
	sheet: ExcelJS.Worksheet,
	nodes: MarkedNode[],
	sections: NodeSection[],
	itemOrder: string[],
	options: ExportOptions,
	colCount: number,
): void {
	const nodeMap = new Map(nodes.map((n) => [n.id, n]));
	const sectionMap = new Map(sections.map((s) => [s.id, s]));

	let rowIndex = 2; // 1-based, row 1 is the header
	const looseNodes: MarkedNode[] = [];

	// Collect loose nodes first to decide if we need an Ungrouped block
	for (const id of itemOrder) {
		if (!sectionMap.has(id) && nodeMap.has(id)) {
			looseNodes.push(nodeMap.get(id)!);
		}
	}

	// Render loose nodes as "Ungrouped" section first if they appear first in order
	let looseRendered = false;

	const renderLoose = () => {
		if (looseRendered || looseNodes.length === 0) return;
		rowIndex = addSectionBlock(sheet, "Ungrouped", looseNodes, options, colCount, rowIndex, true);
		looseRendered = true;
	};

	for (const id of itemOrder) {
		const section = sectionMap.get(id);

		if (section) {
			// If loose nodes appeared before this section in itemOrder, render them first
			const looseFirst = itemOrder.indexOf(looseNodes[0]?.id ?? "") < itemOrder.indexOf(id);
			if (looseFirst) renderLoose();

			const sectionNodes = section.nodeIds
				.map((nid) => nodeMap.get(nid))
				.filter((n): n is MarkedNode => !!n);

			rowIndex = addSectionBlock(sheet, section.name, sectionNodes, options, colCount, rowIndex, false);
		}
	}

	// Render loose nodes at end if not yet rendered
	renderLoose();
}

// ─── Section block ────────────────────────────────────────────────────────────

function addSectionBlock(
	sheet: ExcelJS.Worksheet,
	name: string,
	nodes: MarkedNode[],
	options: ExportOptions,
	colCount: number,
	startRowIndex: number,
	isUngrouped: boolean,
): number {
	let rowIndex = startRowIndex;

	// ── Section header row ────────────────────────────────────────────────────
	const sectionHeaderData = Array(colCount).fill("");
	sectionHeaderData[0] = name;

	const sectionHeaderRow = sheet.addRow(sectionHeaderData);
	sectionHeaderRow.height = 20;

	// Merge across all columns
	if (colCount > 1) {
		sheet.mergeCells(rowIndex, 1, rowIndex, colCount);
	}

	const bgColor = isUngrouped ? COLOR.ungroupedBg : COLOR.sectionBg;
	const fgColor = isUngrouped ? COLOR.ungroupedFg : COLOR.sectionFg;

	sectionHeaderRow.getCell(1).font = { name: FONT_NAME, bold: true, color: { argb: fgColor }, size: 10 };
	sectionHeaderRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
	sectionHeaderRow.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
	sectionHeaderRow.getCell(1).border = {
		top: { style: "thin", color: { argb: COLOR.borderColor } },
		bottom: { style: "thin", color: { argb: COLOR.borderColor } },
	};

	rowIndex++;

	// ── Data rows (grouped so they can be collapsed) ───────────────────────────
	const groupStart = rowIndex;

	for (const node of nodes) {
		const dataRows = resolveNodeRows(node, options);
		for (const data of dataRows) {
			// Prepend empty section column (section label is on the header row)
			const row = sheet.addRow(["", ...data]);
			applyDataRowStyle(row, rowIndex);
			rowIndex++;
		}
	}

	const groupEnd = rowIndex - 1;

	// Apply Excel row grouping so section can be collapsed
	if (groupEnd >= groupStart) {
		for (let r = groupStart; r <= groupEnd; r++) {
			sheet.getRow(r).outlineLevel = 1;
		}
	}

	return rowIndex;
}

// ─── Row resolution ───────────────────────────────────────────────────────────

/**
 * Returns raw cell value arrays for a node (without the section column).
 * The section column is prepended by the caller.
 */
function resolveNodeRows(node: MarkedNode, options: ExportOptions): string[][] {
	if (node.nodeType === "TEXT") {
		return [options.includeLayerNames
			? [node.name, node.previewText]
			: [node.previewText]];
	}

	if (node.childTextNodes?.length) {
		return node.childTextNodes.map((child) =>
			options.includeLayerNames
				? [child.name, child.content]
				: [child.content]
		);
	}

	return [];
}

// ─── Row styling ──────────────────────────────────────────────────────────────

function applyDataRowStyle(row: ExcelJS.Row, rowIndex: number): void {
	const isAlt = rowIndex % 2 === 0;
	row.height = 18;
	row.eachCell({ includeEmpty: true }, (cell) => {
		cell.font = { name: FONT_NAME, size: 10 };
		cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
		if (isAlt) {
			cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.rowAltBg } };
		}
	});
}
