import { ExportOptions, SelectionOptions } from "@ctypes/messages";

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

export const DEFAULT_SELECTION_OPTIONS: SelectionOptions = {
	autogroup: false,
	sync: false,
	filters: {
		number: false,
		price: false,
		url: false,
		email: false,
		empty: false,
	}
};
