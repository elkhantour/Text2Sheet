/// <reference types="@figma/plugin-typings" />
import type { UIToPluginMessage } from "@ctypes/messages";
import { sendNotify } from "./message";
import { PLUGIN_HEIGHT, PLUGIN_WIDTH } from "./constants";
import { loadAndSendState } from "./node";
import { saveIds, saveSections, saveItemOrder } from "./storage";
import {
	handleHighlightMarked,
	handleMarkSelection,
	handleSelectNode,
	handleCreateSection,
	handleDeleteSection,
	handleRenameSection,
	handleReorderItems,
	handleReorderNodesInSection,
	handleSaveExportOptions,
	handleUnmarkNodeList,
	handleMoveNodeListToSection,
	handleSyncSelectionToUI,
	handleResizeWindow,
	handleSaveSelectionOptions,
} from "./handlers";

figma.showUI(__html__, { width: PLUGIN_WIDTH, height: PLUGIN_HEIGHT, title: "Text2Sheet" });
loadAndSendState();

figma.ui.onmessage = async (msg: UIToPluginMessage) => {

	switch (msg.type) {
		case "MARK_SELECTION": await handleMarkSelection(); break;
		case "HIGHLIGHT_MARKED": await handleHighlightMarked(); break;
		case "UNMARK_NODES": await handleUnmarkNodeList(msg.nodeIds); break;
		case "SELECT_NODE": await handleSelectNode(msg.nodeId); break;
		case "LOAD_MARKED": await loadAndSendState(); break;
		case "REORDER_NODES": saveIds(msg.nodeIds); break;
		case "CREATE_SECTION": await handleCreateSection(msg.name, msg.sectionId, msg.topFrameId, msg.topFrameName); break;
		case "DELETE_SECTION": await handleDeleteSection(msg.sectionId); break;
		case "RENAME_SECTION": await handleRenameSection(msg.sectionId, msg.name); break;
		case "REORDER_ITEMS": await handleReorderItems(msg.itemIds); break;
		case "MOVE_NODES_TO_SECTION": await handleMoveNodeListToSection(msg.nodeIds, msg.sectionId, msg.index); break;
		case "REORDER_NODES_IN_SECTION": await handleReorderNodesInSection(msg.sectionId, msg.nodeIds); break;
		case "RESIZE_WINDOW": handleResizeWindow(msg.width, msg.height); break;
		case "SAVE_EXPORT_OPTIONS": await handleSaveExportOptions(msg.options); break;
		case "SAVE_SELECTION_OPTIONS": await handleSaveSelectionOptions(msg.options); break;
		case "CLEAR_ALL":
			saveIds([]);
			saveSections([]);
			saveItemOrder([]);
			await loadAndSendState();
			sendNotify("Cleared all marked layers.");
			break;
	}
};

figma.currentPage.on("nodechange", (event) => {

	const relevant = event.nodeChanges.some((change) =>
		change.type === "PROPERTY_CHANGE" &&
		(change.properties.includes("name") || change.properties.includes("characters")) &&
		(change.node.type === "TEXT" || change.node.type === "FRAME" ||
			change.node.type === "COMPONENT" || change.node.type === "SECTION")
	);

	if (relevant) loadAndSendState();
});

figma.on("selectionchange", () => {
	// on selection, select the highlighted frames
	handleSyncSelectionToUI();
});
