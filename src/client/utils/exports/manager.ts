import { ExportOptions, FrameTab } from "@ctypes/messages";
import { buildTabCSVs, downloadCombinedCSV, downloadZippedCSVs } from "./csv";
import { downloadXLS } from "./xls";


interface Export2File {
	tabs: FrameTab[];
	exportOptions: ExportOptions;
}


export async function export2File({ tabs, exportOptions }: Export2File) {


	switch (exportOptions.exportMode.format) {
		case "csv":
			try {
				const tabCsvs = buildTabCSVs(exportOptions, tabs);
				if (exportOptions.exportMode.structure === "zip") {
					await downloadZippedCSVs(tabCsvs);
				} else {
					downloadCombinedCSV(tabCsvs, exportOptions);
				}

			} finally {
				break;
			}

		case "xls":
			downloadXLS(exportOptions, tabs);
			break;
	}

} 
