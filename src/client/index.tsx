import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@styles/global.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

const root = createRoot(document.getElementById("root")!);
root.render(<Theme
	accentColor="mint"
	grayColor="gray"
	panelBackground="solid"
	scaling="100%"
	appearance="dark"
	radius="large"
>
	<App />
</Theme>);
