import { ExportOptions, FrameTab, MarkedNode, NodeSection } from "@ctypes/messages";
import { buildTabCSVs, downloadCombinedCSV, downloadZippedCSVs } from "./csv";
import { downloadXLS } from "./xls";


interface Export2File {
	nodes: MarkedNode[];
	sections: NodeSection[];
	itemOrder: string[];
	tabs: FrameTab[];
	exportOptions: ExportOptions;
}


export async function export2File({ nodes, sections, itemOrder, tabs, exportOptions }: Export2File) {


	switch (exportOptions.exportMode.format) {
		case "csv":
			try {
				const tabCsvs = buildTabCSVs(nodes, sections, itemOrder, exportOptions, tabs);
				if (exportOptions.exportMode.structure === "zip") {
					await downloadZippedCSVs(tabCsvs);
				} else {
					downloadCombinedCSV(tabCsvs, exportOptions);
				}

			} finally {
				break;
			}

		case "xls":
			downloadXLS(nodes, sections, itemOrder, exportOptions, tabs);
			break;
	}

} 
