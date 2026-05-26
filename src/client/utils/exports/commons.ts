import type { MarkedNode } from "@ctypes/messages";

// ─── Date ─────────────────────────────────────────────────────────────────────

export function today(): string {
	return new Date().toISOString().slice(0, 10);
}

// ─── Filename ─────────────────────────────────────────────────────────────────

export function sanitizeFilename(name: string): string {
	return name.replace(/[\\/:*?"<>|]/g, "_");
}

export function defaultFilename(ext: "csv" | "xlsx", base = "text2sheet"): string {
	return `${base}_${today()}.${ext}`;
}

// ─── Download ─────────────────────────────────────────────────────────────────

export function triggerDownload(content: Blob | string, filename: string): void {
	const bom = "\uFEFF";
	const blob =
		content instanceof Blob
			? content
			: new Blob([bom + content], { type: "text/csv;charset=utf-8;" });

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

// ─── Row counting ─────────────────────────────────────────────────────────────

export function countExportableRows(nodes: MarkedNode[]): number {
	let count = 0;
	for (const node of nodes) {
		if (node.nodeType === "TEXT") count += 1;
		else if (node.childTextNodes) count += node.childTextNodes.length;
	}
	return count;
}
