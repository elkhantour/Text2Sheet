/// <reference types="@figma/plugin-typings" />

import type {
  UIToPluginMessage,
  PluginToUIMessage,
  MarkedNode,
  ChildTextNode,
} from "@ctypes/messages";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "text2sheet_marked_ids";
const PLUGIN_WIDTH = 320;
const PLUGIN_HEIGHT = 520;

// ─── Plugin entry ─────────────────────────────────────────────────────────────

figma.showUI(__html__, { width: PLUGIN_WIDTH, height: PLUGIN_HEIGHT, title: "Text2Sheet" });

// Send initial state on open
loadAndSendMarkedNodes();

// ─── Message handler ──────────────────────────────────────────────────────────

figma.ui.onmessage = async (msg: UIToPluginMessage) => {
  switch (msg.type) {
    case "MARK_SELECTION":
      await handleMarkSelection();
      break;

    case "HIGHLIGHT_MARKED":
      await handleHighlightMarked();
      break;

    case "UNMARK_NODE":
      await handleUnmarkNode(msg.nodeId);
      break;

    case "CLEAR_ALL":
      await saveIds([]);
      await loadAndSendMarkedNodes();
      sendNotify("Cleared all marked layers.");
      break;

    case "SELECT_NODE":
      handleSelectNode(msg.nodeId);
      break;

    case "LOAD_MARKED":
      await loadAndSendMarkedNodes();
      break;

    case "REORDER_NODES":
      await handleReorder(msg.nodeIds);
      break;
  }
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleHighlightMarked(): Promise<void> {
  const storedIds = await getStoredIds();
  const nodes = storedIds
    .map((id) => figma.getNodeById(id))
    .filter((n): n is SceneNode => n !== null && "parent" in n && n.parent !== null);

  if (nodes.length === 0) {
    sendError("No marked layers found in this file.");
    return;
  }

  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
  sendNotify(`Highlighted ${nodes.length} marked layer${nodes.length !== 1 ? "s" : ""}.`);
}

async function handleMarkSelection(): Promise<void> {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    sendError("Select at least one layer in the canvas first.");
    return;
  }

  const storedIds = await getStoredIds();

  for (const node of selection) {
    if (!storedIds.includes(node.id)) {
      storedIds.push(node.id);
    }
  }

  await saveIds(storedIds);
  await loadAndSendMarkedNodes();
  sendNotify(`Marked ${selection.length} layer${selection.length > 1 ? "s" : ""} for export.`);
}

async function handleUnmarkNode(nodeId: string): Promise<void> {
  const storedIds = await getStoredIds();
  const updated = storedIds.filter((id) => id !== nodeId);
  await saveIds(updated);
  await loadAndSendMarkedNodes();
}

function handleSelectNode(nodeId: string): void {
  const node = figma.getNodeById(nodeId);
  if (!node) {
    sendError("Layer no longer exists in this file.");
    return;
  }
  if (!("parent" in node) || node.parent === null) {
    sendError("Cannot select this node.");
    return;
  }
  figma.currentPage.selection = [node as SceneNode];
  figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
}

async function handleReorder(nodeIds: string[]): Promise<void> {
  await saveIds(nodeIds);
  // No need to re-resolve; UI already knows the order
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

async function getStoredIds(): Promise<string[]> {
  const raw = await figma.clientStorage.getAsync(STORAGE_KEY);
  if (Array.isArray(raw)) return raw as string[];
  return [];
}

async function saveIds(ids: string[]): Promise<void> {
  await figma.clientStorage.setAsync(STORAGE_KEY, ids);
}

// ─── Node resolution ──────────────────────────────────────────────────────────

async function loadAndSendMarkedNodes(): Promise<void> {
  const storedIds = await getStoredIds();
  const validIds: string[] = [];
  const markedNodes: MarkedNode[] = [];

  for (const id of storedIds) {
    const node = figma.getNodeById(id);
    if (!node) continue; // Node deleted from file — skip silently

    validIds.push(id);
    markedNodes.push(resolveNode(node));
  }

  // Prune deleted nodes from storage
  if (validIds.length !== storedIds.length) {
    await saveIds(validIds);
  }

  sendToUI({ type: "MARKED_NODES_UPDATE", nodes: markedNodes });
}

function resolveNode(node: BaseNode): MarkedNode {
  if (node.type === "TEXT") {
    return {
      id: node.id,
      name: node.name,
      nodeType: node.type,
      previewText: node.characters,
    };
  }

  // Non-text: recurse into children to collect text nodes
  const childTextNodes = collectTextChildren(node);

  return {
    id: node.id,
    name: node.name,
    nodeType: node.type,
    previewText: "",
    childTextNodes,
  };
}

function collectTextChildren(node: BaseNode): ChildTextNode[] {
  const results: ChildTextNode[] = [];

  if (node.type === "TEXT") {
    results.push({ id: node.id, name: node.name, content: node.characters });
    return results;
  }

  if ("children" in node) {
    for (const child of node.children) {
      results.push(...collectTextChildren(child));
    }
  }

  return results;
}

// ─── UI messaging ─────────────────────────────────────────────────────────────

function sendToUI(msg: PluginToUIMessage): void {
  figma.ui.postMessage(msg);
}

function sendError(message: string): void {
  sendToUI({ type: "ERROR", message });
}

function sendNotify(message: string): void {
  sendToUI({ type: "NOTIFY", message });
  figma.notify(message);
}
