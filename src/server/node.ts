import type { ChildTextNode, MarkedNode } from "@ctypes/messages";
import { sendToUI } from "./message";
import { getStoredIds, saveIds, getSections, saveSections, getItemOrder, saveItemOrder, getExportOptions } from "./storage";

// ─── Main state loader ────────────────────────────────────────────────────────

export async function loadAndSendState(): Promise<void> {
  const [storedIds, sections, itemOrder, exportOptions] = await Promise.all([
    getStoredIds(),
    getSections(),
    getItemOrder(),
    getExportOptions(),
  ]);

  // ── Resolve & prune deleted nodes ────────────────────────────────────────
  const validIds: string[] = [];
  const markedNodes: MarkedNode[] = [];

  for (const id of storedIds) {
    const node = await figma.getNodeByIdAsync(id);
    if (!node) continue;
    validIds.push(id);
    resolveNode(node).forEach((child) => markedNodes.push(child));
  }

  if (validIds.length !== storedIds.length) await saveIds(validIds);

  // ── Prune deleted nodes from sections ────────────────────────────────────
  const validIdSet = new Set(validIds);
  const cleanedSections = sections.map((s) => ({
    ...s,
    nodeIds: s.nodeIds.filter((id) => validIdSet.has(id)),
  }));

  // ── Prune deleted nodes/sections from itemOrder ───────────────────────────
  const sectionIdSet = new Set(cleanedSections.map((s) => s.id));
  const cleanedOrder = itemOrder.filter((id) => validIdSet.has(id) || sectionIdSet.has(id));

  // ── Append any untracked loose node ──────────────────────────────────────
  const idsInSections = new Set(cleanedSections.flatMap((s) => s.nodeIds));
  for (const id of validIds) {
    if (!cleanedOrder.includes(id) && !idsInSections.has(id)) cleanedOrder.push(id);
  }

  if (
    cleanedSections.some((s, i) => s.nodeIds.length !== sections[i]?.nodeIds.length) ||
    cleanedOrder.length !== itemOrder.length
  ) {
    await saveSections(cleanedSections);
    await saveItemOrder(cleanedOrder);
  }

  sendToUI({ type: "STATE_UPDATE", nodes: markedNodes, sections: cleanedSections, itemOrder: cleanedOrder, exportOptions });
}

// Legacy shim
export async function loadAndSendMarkedNodes(): Promise<void> {
  return loadAndSendState();
}

// ─── Node resolution (unchanged) ─────────────────────────────────────────────

export function resolveNode(node: BaseNode): MarkedNode[] {
  if (node.type === "TEXT") {
    return [{ id: node.id, name: node.name, nodeType: node.type, previewText: node.characters }];
  }
  const childTextNodes = collectTextChildren(node);
  return childTextNodes.map<MarkedNode>((child) => ({
    id: child.id, name: child.name, nodeType: node.type, previewText: child.content,
  }));
}

export function collectTextChildren(node: BaseNode): ChildTextNode[] {
  const results: ChildTextNode[] = [];
  if (node.type === "TEXT") {
    results.push({ id: node.id, name: node.name, content: node.characters });
    return results;
  }
  if ("children" in node) {
    for (const child of node.children) results.push(...collectTextChildren(child));
  }
  return results;
}
