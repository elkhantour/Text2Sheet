// ─── Message types (UI → Plugin) ────────────────────────────────────────────

export type UIToPluginMessage =
  | { type: "MARK_SELECTION" }
  | { type: "HIGHLIGHT_MARKED" }
  | { type: "CLEAR_ALL" }
  | { type: "UNMARK_NODE"; nodeId: string }
  | { type: "SELECT_NODE"; nodeId: string }
  | { type: "LOAD_MARKED" }
  | { type: "REORDER_NODES"; nodeIds: string[] };

// ─── Message types (Plugin → UI) ────────────────────────────────────────────

export type PluginToUIMessage =
  | { type: "MARKED_NODES_UPDATE"; nodes: MarkedNode[] }
  | { type: "ERROR"; message: string }
  | { type: "NOTIFY"; message: string };

// ─── Data shapes ─────────────────────────────────────────────────────────────

export interface MarkedNode {
  id: string;
  name: string;
  /** "TEXT" | "FRAME" | "GROUP" | "COMPONENT" | etc. */
  nodeType: string;
  /** Resolved text content (empty string for non-text containers) */
  previewText: string;
  /** For non-text nodes: list of child text nodes found recursively */
  childTextNodes?: ChildTextNode[];
}

export interface ChildTextNode {
  id: string;
  name: string;
  content: string;
}
