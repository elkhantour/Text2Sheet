import { ExportOptions } from "@ctypes/messages";

export const ORPHAN_TAB_ID = "__orphan__";
export const ORPHAN_TAB_NAME = "(ungrouped)";

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
	includeLayerNames: false,
	splitBySections: true,
	exportMode: {
		format: "csv",
		structure: "combined",
	},
};
