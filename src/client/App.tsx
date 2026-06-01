import React from "react";
import { usePlugin } from "./hooks/usePlugin";
import { Toolbar } from "@components/Toolbar/Toolbar";
import { Footer } from "@components/Footer/Footer";
import { Toast } from "@components/Toast/Toast";
import { NodeSectionList } from "@components/NodeSectionList/NodeSectionList";
import { FrameTabs } from "@components/FrameTab/FrameTab";
import { LoadingState } from "@components/Loading/Loading";
import { NodeSelectionProvider } from "@contexts/useNodeSelection";
import { TabsProvider } from "@contexts/useTabs";

export function App(): React.ReactElement {

	const { isLoading } = usePlugin();

	const {
		markedNodes,
		sections,
		itemOrder,
	} = usePlugin();


	return (
		<TabsProvider nodes={markedNodes} sections={sections} itemOrder={itemOrder}>
			<div className=" flex h-screen flex-col relative bg-[var(--bg)]">
				<Toolbar />

				{isLoading ? <LoadingState /> :
					<NodeSelectionProvider>
						<FrameTabs />
						<NodeSectionList />
					</NodeSelectionProvider>

				}

				<Footer />
				<Toast />
			</div>
		</TabsProvider>
	);
}

