/// <reference types="@figma/plugin-typings" />

import type {
	UIToPluginMessage,
} from "@ctypes/messages";
import { sendNotify } from "./message";
import { PLUGIN_HEIGHT, PLUGIN_WIDTH } from "./constants";
import { loadAndSendMarkedNodes } from "./node";
import { saveIds } from "./storage";
import { handleHighlightMarked, handleMarkSelection, handleReorder, handleSelectNode, handleUnmarkNode } from "./handlers";



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
			await handleSelectNode(msg.nodeId);
			break;

		case "LOAD_MARKED":
			await loadAndSendMarkedNodes();
			break;

		case "REORDER_NODES":
			await handleReorder(msg.nodeIds);
			break;
	}
};






