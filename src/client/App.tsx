import React from "react";
import { Toolbar } from "@components/Toolbar/Toolbar";
import { Footer } from "@components/Footer/Footer";
import { Toast } from "@components/Toast/Toast";
import { NodeSectionList } from "@components/NodeSectionList/NodeSectionList";
import { NodeSelectionProvider } from "@contexts/useNodeSelection";
import { SectionSelectionProvider } from "@contexts/useSectionSelection";

import Resizer from "@components/Resizer/Resizer";
import { PluginProvider } from "@contexts/usePlugin";
import TreeView from "@components/TreeView/TreeView";

export function App(): React.ReactElement {

	return (
		<PluginProvider>
			<SectionSelectionProvider>
				<NodeSelectionProvider>
					<div className="flex h-screen flex-row relative bg-neutral-950">
						<TreeView className="min-w-[200px] px-4 py-4 bg-neutral-900/70" />
						<div className="flex-1 flex flex-col h-full overflow-hidden min-w-[440px]">
							<Toolbar />
							<NodeSectionList />
							<Footer />
						</div>
						<Toast />
						<Resizer />
					</div>
				</NodeSelectionProvider>
			</SectionSelectionProvider>
		</PluginProvider>
	);
}

