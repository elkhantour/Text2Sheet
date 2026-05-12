import { PluginToUIMessage } from "@ctypes/messages";

export function sendToUI(msg: PluginToUIMessage): void {
  figma.ui.postMessage(msg);
}

export function sendError(message: string): void {
  sendToUI({ type: "ERROR", message });
}

export function sendNotify(message: string): void {
  sendToUI({ type: "NOTIFY", message });
  figma.notify(message);
}
