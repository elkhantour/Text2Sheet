import type { MarkedNode } from "@ctypes/messages";

/**
 * Builds a CSV string from the marked nodes list.
 * Each row: layerName, textContent
 * Child text nodes from container layers are flattened into individual rows.
 */
export function buildCSV(nodes: MarkedNode[]): string {
  const rows: string[][] = [["Layer Name", "Text Content"]];

  for (const node of nodes) {
    if (node.nodeType === "TEXT") {
      rows.push([escapeCsvCell(node.name), escapeCsvCell(node.previewText)]);
    } else if (node.childTextNodes && node.childTextNodes.length > 0) {
      for (const child of node.childTextNodes) {
        rows.push([escapeCsvCell(child.name), escapeCsvCell(child.content)]);
      }
    }
    // Non-text nodes with no children are skipped
  }

  return rows.map((row) => row.join(",")).join("\r\n");
}

/**
 * Triggers a browser download of the CSV file.
 */
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

/** Wraps a CSV cell in quotes if it contains commas, quotes, or newlines. */
function escapeCsvCell(value: string): string {
  const needsQuoting = /[",\r\n]/.test(value);
  if (needsQuoting) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Count total exportable text rows from the node list. */
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
