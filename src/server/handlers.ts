import { ExportOptions } from "@ctypes/messages";
import { sendError, sendNotify } from "./message";
import { loadAndSendState } from "./node";
import { getStoredIds, saveIds, getSections, saveSections, getItemOrder, saveItemOrder, saveExportOptions } from "./storage";

// ─── Existing handlers (updated to call loadAndSendState) ─────────────────────

export async function handleHighlightMarked(): Promise<void> {
  const storedIds = await getStoredIds();
  const nodes = await Promise.all(storedIds.map((id) => figma.getNodeByIdAsync(id)));
  const validNodes = nodes.filter((n): n is SceneNode => n !== null && "parent" in n && n.parent !== null);

  if (validNodes.length === 0) {
    sendError("No marked layers found in this file.");
    return;
  }

  figma.currentPage.selection = validNodes;
  figma.viewport.scrollAndZoomIntoView(validNodes);
  sendNotify(`Highlighted ${validNodes.length} marked layer${validNodes.length !== 1 ? "s" : ""}.`);
}

export async function handleMarkSelection(): Promise<void> {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    sendError("Select at least one layer in the canvas first.");
    return;
  }

  const storedIds = await getStoredIds();
  const itemOrder = await getItemOrder();
  const selectionTextNodeIds: string[] = [];

  const getChildTextNodes = (node: SceneNode) => {
    if (node.type === "TEXT") return selectionTextNodeIds.push(node.id);
    if ("children" in node) node.children.forEach(getChildTextNodes);
  };
  selection.forEach((sel) => getChildTextNodes(sel));

  for (const id of selectionTextNodeIds) {
    if (!storedIds.includes(id)) {
      storedIds.push(id);
      // Append as a loose top-level item if not already tracked
      if (!itemOrder.includes(id)) itemOrder.push(id);
    }
  }

  await saveIds(storedIds);
  await saveItemOrder(itemOrder);
  await loadAndSendState();
  sendNotify(`Marked ${selectionTextNodeIds.length} layer${selectionTextNodeIds.length > 1 ? "s" : ""} for export.`);
}

export async function handleUnmarkNode(nodeId: string): Promise<void> {
  const [storedIds, sections, itemOrder] = await Promise.all([
    getStoredIds(),
    getSections(),
    getItemOrder(),
  ]);

  await Promise.all([
    saveIds(storedIds.filter((id) => id !== nodeId)),
    saveSections(sections.map((s) => ({ ...s, nodeIds: s.nodeIds.filter((id) => id !== nodeId) }))),
    saveItemOrder(itemOrder.filter((id) => id !== nodeId)),
  ]);

  await loadAndSendState();
}

export async function handleSelectNode(nodeId: string): Promise<void> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) { sendError("Layer no longer exists in this file."); return; }
  if (!("parent" in node) || node.parent === null) { sendError("Cannot select this node."); return; }
  figma.currentPage.selection = [node as SceneNode];
  figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
}

export async function handleReorder(nodeIds: string[]): Promise<void> {
  await saveIds(nodeIds);
}

// ─── Section handlers ─────────────────────────────────────────────────────────

export async function handleCreateSection(name: string): Promise<void> {
  const [sections, itemOrder] = await Promise.all([getSections(), getItemOrder()]);

  const newSection = {
    id: `section_${Date.now()}`,
    name,
    nodeIds: [] as string[],
  };

  await saveSections([...sections, newSection]);
  await saveItemOrder([...itemOrder, newSection.id]); // append at bottom
  await loadAndSendState();
}

export async function handleDeleteSection(sectionId: string): Promise<void> {
  const [sections, itemOrder] = await Promise.all([getSections(), getItemOrder()]);

  const target = sections.find((s) => s.id === sectionId);
  if (!target) return;

  // Promote the section's nodes back to loose top-level items, inserted where the section was
  const sectionIdx = itemOrder.indexOf(sectionId);
  const newOrder = [...itemOrder];
  newOrder.splice(sectionIdx, 1, ...target.nodeIds); // replace section id with its children

  await saveSections(sections.filter((s) => s.id !== sectionId));
  await saveItemOrder(newOrder);
  await loadAndSendState();
}

export async function handleRenameSection(sectionId: string, name: string): Promise<void> {
  const sections = await getSections();
  await saveSections(sections.map((s) => (s.id === sectionId ? { ...s, name } : s)));
  await loadAndSendState();
}

export async function handleReorderItems(itemIds: string[]): Promise<void> {
  await saveItemOrder(itemIds);
  await loadAndSendState();
}

export async function handleMoveNodeToSection(
  nodeId: string,
  sectionId: string | null,
  index: number
): Promise<void> {
  const [sections, itemOrder] = await Promise.all([getSections(), getItemOrder()]);

  // Remove node from whichever section currently holds it
  const cleanedSections = sections.map((s) => ({
    ...s,
    nodeIds: s.nodeIds.filter((id) => id !== nodeId),
  }));

  // Remove node from top-level order if it was loose
  const cleanedOrder = itemOrder.filter((id) => id !== nodeId);

  if (sectionId === null) {
    // Move to loose top-level at the given index
    cleanedOrder.splice(index, 0, nodeId);
    await saveSections(cleanedSections);
    await saveItemOrder(cleanedOrder);
  } else {
    // Insert into target section at the given index
    const targetSection = cleanedSections.find((s) => s.id === sectionId);
    if (!targetSection) return;
    targetSection.nodeIds.splice(index, 0, nodeId);
    await saveSections(cleanedSections);
    await saveItemOrder(cleanedOrder);
  }

  await loadAndSendState();
}

export async function handleReorderNodesInSection(
  sectionId: string,
  nodeIds: string[]
): Promise<void> {
  const sections = await getSections();
  await saveSections(sections.map((s) => (s.id === sectionId ? { ...s, nodeIds } : s)));
  await loadAndSendState();
}

// ─── Export options handler ───────────────────────────────────────────────────

export async function handleSaveExportOptions(options: ExportOptions): Promise<void> {
  await saveExportOptions(options);
  // No need to broadcast STATE_UPDATE — UI already has the new value locally
}
