import React from "react";
import { Toolbar } from "@components/Toolbar/Toolbar";
import { Footer } from "@components/Footer/Footer";
import { Toast } from "@components/Toast/Toast";
import { NodeSectionList } from "@components/NodeSectionList/NodeSectionList";
import { FrameTabs } from "@components/FrameTab/FrameTab";
import { NodeSelectionProvider } from "@contexts/useNodeSelection";
import { TabsProvider } from "@contexts/useTabs";
import { SectionSelectionProvider } from "@contexts/useSectionSelection";

import Resizer from "@components/Resizer/Resizer";
import { PluginProvider } from "@contexts/usePlugin";

export function App(): React.ReactElement {

	return (
		<PluginProvider>
			<TabsProvider>
				<SectionSelectionProvider>
					<NodeSelectionProvider>
						<div className=" flex h-screen flex-col relative bg-[var(--bg)]">
							<Toolbar />
							<FrameTabs />
							<NodeSectionList />
							<Footer />
							<Toast />
							<Resizer />
						</div>
					</NodeSelectionProvider>
				</SectionSelectionProvider>
			</TabsProvider>
		</PluginProvider>
	);
}

