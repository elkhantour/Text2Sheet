import type { MarkedNode, NodeSection, ExportOptions } from "@ctypes/messages";

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Builds a CSV string from the marked nodes list.
 * When splitBySections is true and sections are provided, nodes are grouped
 * under a section header row, with an empty row between sections.
 */
export function buildCSV(
  nodes: MarkedNode[],
  options: ExportOptions,
  sections?: NodeSection[],
  itemOrder?: string[],
): string {
  if (options.splitBySections && sections && sections.length > 0 && itemOrder) {
    return buildSectionedCSV(nodes, options, sections, itemOrder);
  }
  return buildFlatCSV(nodes, options);
}

// ─── Flat (existing behaviour) ────────────────────────────────────────────────

function buildFlatCSV(nodes: MarkedNode[], options: ExportOptions): string {
  const rows: string[][] = [];
  rows.push(headerRow(options));
  for (const node of nodes) {
    rows.push(...nodeRows(node, options));
  }
  return serialize(rows);
}

// ─── Sectioned ────────────────────────────────────────────────────────────────

function buildSectionedCSV(
  nodes: MarkedNode[],
  options: ExportOptions,
  sections: NodeSection[],
  itemOrder: string[],
): string {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const idsInSections = new Set(sections.flatMap((s) => s.nodeIds));

  const rows: string[][] = [];
  rows.push(headerRow(options));

  // Walk itemOrder so the CSV respects the user's drag order
  let firstBlock = true;

  for (const id of itemOrder) {
    const section = sectionMap.get(id);

    if (section) {
      // ── Section block ──────────────────────────────────────────────────
      if (!firstBlock) rows.push([]); // blank separator between blocks
      rows.push(sectionHeaderRow(section.name, options));

      for (const nodeId of section.nodeIds) {
        const node = nodeMap.get(nodeId);
        if (node) rows.push(...nodeRows(node, options));
      }
      firstBlock = false;

    } else {
      // ── Loose node ─────────────────────────────────────────────────────
      const node = nodeMap.get(id);
      if (!node) continue;
      if (!firstBlock) rows.push([]); // blank separator before loose node block
      rows.push(...nodeRows(node, options));
      firstBlock = false;
    }
  }

  // Safety net: any node not referenced in itemOrder
  for (const node of nodes) {
    if (!itemOrder.includes(node.id) && !idsInSections.has(node.id)) {
      rows.push(...nodeRows(node, options));
    }
  }

  return serialize(rows);
}

// ─── Row builders ─────────────────────────────────────────────────────────────

function headerRow(options: ExportOptions): string[] {
  return options.includeLayerNames ? ["Layer Name", "Text Content"] : ["Text Content"];
}

/**
 * A section header row: the section name in the first column, rest empty.
 * Styled with surrounding "===" so it's visually distinctive when opened in Excel/Sheets.
 */
function sectionHeaderRow(name: string, options: ExportOptions): string[] {
  const label = escapeCsvCell(`=== ${name} ===`);
  return options.includeLayerNames ? [label, ""] : [label];
}

function nodeRows(node: MarkedNode, options: ExportOptions): string[][] {
  const rows: string[][] = [];

  if (node.nodeType === "TEXT") {
    rows.push(
      options.includeLayerNames
        ? [escapeCsvCell(node.name), escapeCsvCell(node.previewText)]
        : [escapeCsvCell(node.previewText)]
    );
  } else if (node.childTextNodes && node.childTextNodes.length > 0) {
    for (const child of node.childTextNodes) {
      rows.push(
        options.includeLayerNames
          ? [escapeCsvCell(child.name), escapeCsvCell(child.content)]
          : [escapeCsvCell(child.content)]
      );
    }
  }

  return rows;
}

// ─── Serialise ────────────────────────────────────────────────────────────────

function serialize(rows: string[][]): string {
  return rows.map((row) => row.join(",")).join("\r\n");
}

// ─── Download ─────────────────────────────────────────────────────────────────

export function downloadCSV(csv: string, filename = "text2sheet_export.csv"): void {
  const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeCsvCell(value: string): string {
  const needsQuoting = /[",\r\n]/.test(value);
  if (needsQuoting) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function countExportableRows(nodes: MarkedNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.nodeType === "TEXT") {
      count += 1;
    } else if (node.childTextNodes) {
      count += node.childTextNodes.length;
    }
  }
  return count;
}
