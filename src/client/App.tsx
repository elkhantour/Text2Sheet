import React from "react";
import { usePlugin } from "./hooks/usePlugin";
import { Toolbar } from "@components/Toolbar/Toolbar";
import { Footer } from "@components/Footer/Footer";
import { Toast } from "@components/Toast/Toast";
import { NodeSectionList } from "@components/NodeSectionList/NodeSectionList";
import { FrameTabs } from "@components/FrameTab/FrameTab";
import { LoadingState } from "@components/Loading/Loading";

export function App(): React.ReactElement {

	const { isLoading } = usePlugin();

	return (
		<div className=" flex h-screen flex-col relative bg-[var(--bg)]">
	  <Toolbar />
	  
			{isLoading ? <LoadingState /> :
				<>
					<FrameTabs />
					<NodeSectionList />
				</>
			}

			<Footer />
			<Toast />
		</div>
	);
}

