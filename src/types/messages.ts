// ─── Message types (UI → Plugin) ────────────────────────────────────────────

export type UIToPluginMessage =
	| { type: "MARK_SELECTION" }
	| { type: "HIGHLIGHT_MARKED" }
	| { type: "CLEAR_ALL" }
	| { type: "UNMARK_NODES"; nodeIds: string[] }
	| { type: "SELECT_NODE"; nodeId: string }
	| { type: "LOAD_MARKED" }
	| { type: "RESOLVE_TAB", tabId: string; }
	| { type: "INIT_LOAD" }
	| { type: "REORDER_ITEMS"; tabId: string; itemIds: string[] }
	| { type: "CREATE_SECTION"; name: string; sectionId: string; tabId: string }
	| { type: "DELETE_SECTION"; sectionId: string; tabId: string }
	| { type: "RENAME_SECTION"; sectionId: string; name: string }
	| { type: "MOVE_NODES_TO_SECTION"; nodeIds: string[]; sectionId: string | null; index: number }
	| { type: "REORDER_NODES_IN_SECTION"; sectionId: string; nodeIds: string[] }
	| { type: "SAVE_EXPORT_OPTIONS"; options: ExportOptions }
	| { type: "SAVE_SELECTION_OPTIONS"; options: SelectionOptions }
	| { type: "RESIZE_WINDOW"; width: number; height: number };


// ─── Message types (Plugin → UI) ────────────────────────────────────────────

export type PluginToUIMessage =
	/** Initial load + any mutation: always the full up-to-date tab list */
	| { type: "STATE_UPDATE"; tree: TreeNode[]; exportOptions: ExportOptions; globalStats: GlobalStats; selectionOptions: SelectionOptions; }
	/** Server push after any mutation — the fully updated tab */
	| { type: "TAB_UPDATED"; tab: FrameTab; globalStats: GlobalStats; }
	| { type: "TAB_RESOLVED"; tab: FrameTab | null; }
	| { type: "ERROR"; message: string }
	| { type: "NOTIFY"; message: string }
	| { type: "SELECT_NODES"; nodeIds: string[] }
	| { type: "LATEST_ADDED_NODES"; nodeIds: string[] }


// ─── Data shapes ─────────────────────────────────────────────────────────────

export interface GlobalStats {
	rowsCount: number;
	pagesCount: number;
};

export interface MarkedNode {
	id: string;
	name: string;
	nodeType: string;
	previewText: string;
	childTextNodes?: ChildTextNode[];
	topFrameId: string;
	sectionId?: string;
}

export interface NodeSection {
	id: string;
	name: string;
	nodes: MarkedNode[];
	topFrameId: string;
	collapsed?: boolean;
}

export interface FrameTab {
	id: string;
	name: string;
	/** Orphan nodes not belonging to any section */
	nodes: MarkedNode[];
	sections: NodeSection[];
	/** Interleaved node IDs + section IDs in display order */
	itemOrder: string[];
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

export interface SelectionOptions {
	autogroup: boolean;
	sync: boolean;
	filters: {
		number: boolean;
		email: boolean;
		price: boolean;
		empty: boolean;
		url: boolean;
	}
}

export interface TreeNode {
	id: string;
	name: string;
	children?: TreeNode[];
	tab?: FrameTab;
}
