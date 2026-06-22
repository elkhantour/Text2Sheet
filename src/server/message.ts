import { PluginToUIMessage } from "@ctypes/messages";

export function sendToUI(msg: PluginToUIMessage): void {
	figma.ui.postMessage(msg);
}

export function sendError(message: string): void {
	sendToUI({ type: "NOTIFY", kind: "ERROR", message });
}

export function sendSuccess(message: string): void {
	sendToUI({ type: "NOTIFY", kind: "SUCCESS", message });
	figma.notify(message);
}

export function sendInfo(message: string): void {
	sendToUI({ type: "NOTIFY", kind: "INFO", message });
}

export function sendLoading(message: string): void {
	sendToUI({ type: "NOTIFY", kind: "LOADING", message });
}

export function closeNotification(): void {
	sendToUI({ type: "NOTIFY_CLOSE" });
}
