// ─── Message types (UI → Plugin) ────────────────────────────────────────────

export type UIToPluginMessage =
	| { type: "MARK_SELECTION" }
	| { type: "HIGHLIGHT_MARKED" }
	| { type: "CLEAR_ALL" }
	| { type: "UNMARK_NODES"; nodeIds: string[] }
	| { type: "SELECT_NODE"; nodeId: string }
	| { type: "LOAD_MARKED" }
	| { type: "REORDER_ITEMS"; itemIds: string[] }
	| { type: "CREATE_SECTION"; name: string, topFrameId: string }
	| { type: "DELETE_SECTION"; sectionId: string }
	| { type: "RENAME_SECTION"; sectionId: string; name: string }
	| { type: "MOVE_NODES_TO_SECTION"; nodeIds: string[]; sectionId: string | null; index: number }
	| { type: "REORDER_NODES_IN_SECTION"; sectionId: string; nodeIds: string[] }
	| { type: "SAVE_EXPORT_OPTIONS"; options: ExportOptions }
	// Legacy
	| { type: "REORDER_NODES"; nodeIds: string[] };

// ─── Message types (Plugin → UI) ────────────────────────────────────────────

export type PluginToUIMessage =
	| { type: "MARKED_NODES_UPDATE"; nodes: MarkedNode[] }
	| { type: "STATE_UPDATE"; nodes: MarkedNode[]; sections: NodeSection[]; itemOrder: string[]; exportOptions: ExportOptions }
	| { type: "ERROR"; message: string }
	| { type: "NOTIFY"; message: string }
	| { type: "SELECT_NODES"; nodeIds: string[] };

// ─── Data shapes ─────────────────────────────────────────────────────────────

export interface MarkedNode {
	id: string;
	name: string;
	nodeType: string;
	previewText: string;
	childTextNodes?: ChildTextNode[];
	/** ID of the top-level frame this node lives under */
	topFrameId: string;
	/** Display name of that top-level frame */
	topFrameName: string;
}

export interface NodeSection {
	id: string;
	name: string;
	nodeIds: string[];
	collapsed?: boolean;
	/** The top-level frame this section belongs to (set at creation) */
	topFrameId: string;
}

export interface ChildTextNode {
	id: string;
	name: string;
	content: string;
}

export type TopLevelItem =
	| { kind: "node"; id: string }
	| { kind: "section"; id: string };


export type ExportFormat = "xls" | "csv";

export type ExportMode = {
	format: ExportFormat;
	structure: "combined" | "zip";
};

export interface ExportOptions {
	includeLayerNames: boolean;
	splitBySections: boolean;
	exportMode: ExportMode;
}


/** A derived tab — not stored, computed from nodes + sections */
export interface FrameTab {
	topFrameId: string;
	topFrameName: string;
}
