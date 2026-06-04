import { usePlugin } from "@contexts/usePlugin";
import React from "react";

export default () => {

	const { resizeWindow } = usePlugin();

	return (
		<svg
			onPointerDown={(_) => {
				const onMove = (moveEvent: PointerEvent) => resizeWindow(moveEvent.clientX, moveEvent.clientY);

				const onUp = () => {
					window.removeEventListener("pointermove", onMove);
					window.removeEventListener("pointerup", onUp);
				};

				window.addEventListener("pointermove", onMove);
				window.addEventListener("pointerup", onUp);
			}}
			className="resizeee cursor-nwse-resize absolute bottom-0 right-0 z-10 h-4 w-4 m-0.5" fill={"#444444"}
			width="100%" height="100%" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
			<path d="M20.5 0.5V4.31659L4.31659 20.5H0.5L20.5 0.5Z" />
			<path d="M20.5 7.24309V11.0597L11.0597 20.5H7.2431L20.5 7.24309Z" />
			<path d="M20.5 13.9862V17.8028L17.8028 20.5H13.9862L20.5 13.9862Z" />
		</svg>


	);
}
