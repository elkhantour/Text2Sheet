import React from "react";
import { usePlugin } from "./hooks/usePlugin";
import { Toolbar } from "@components/Toolbar/Toolbar";
import { Footer } from "@components/Footer/Footer";
import { Toast } from "@components/Toast/Toast";
import { NodeSectionList } from "@components/NodeSectionList/NodeSectionList";
import { useTabs } from "./hooks/useTabs";
import { FrameTabs } from "@components/FrameTab/FrameTab";

export function App(): React.ReactElement {
	const {
		markedNodes,
		sections,
		itemOrder,
		isLoading,
		toast,
		markSelection,
		clearAll,
		unmarkNode,
		selectNode,
		dismissToast,
		createSection,
		deleteSection,
		renameSection,
		reorderItems,
		moveNodeToSection,
		reorderNodesInSection,
		exportOptions,
		saveExportOptions,
	} = usePlugin();


	const {
		tabs,
		activeTabId,
		setActiveTabId,
		activeNodes,
		activeSections,
	} = useTabs(markedNodes, sections, itemOrder);


	console.log({ tabs });
	return (
		<div className=" flex h-screen flex-col relative bg-[var(--bg)]">
			<Toolbar
				nodes={markedNodes}
				onClearAll={clearAll}
				exportOptions={exportOptions}
				onMarkSelection={markSelection}
				onSaveExportOptions={saveExportOptions}
				tabs={tabs}
			/>


			{isLoading ? (
				<LoadingState />
			) : (<>
				<FrameTabs
					tabs={tabs}
					activeTabId={activeTabId}
					onSelect={setActiveTabId}
				/>

				<NodeSectionList
					nodes={activeNodes}
					sections={activeSections}
					itemOrder={itemOrder}
					activeTabId={activeTabId}
					onUnmark={unmarkNode}
					onSelect={selectNode}
					onCreateSection={createSection}
					onDeleteSection={deleteSection}
					onRenameSection={renameSection}
					onReorderItems={reorderItems}
					onMoveNodeToSection={moveNodeToSection}
					onReorderNodesInSection={reorderNodesInSection}
				/>
			</>
			)}


			<Footer
				nodes={markedNodes}
				sections={sections}
				itemOrder={itemOrder}
				exportOptions={exportOptions}
				onMarkSelection={markSelection}
				tabs={tabs}
			/>

			{toast && (
				<Toast
					message={toast.message}
					kind={toast.kind}
					onDismiss={dismissToast}
				/>
			)}
		</div>
	);
}

function LoadingState(): React.ReactElement {
	return (
		<div
			style={{
				flex: 1,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				color: "var(--text-muted)",
				fontSize: 12,
				fontFamily: "var(--font)",
				gap: 8,
			}}
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 14 14"
				fill="none"
				style={{ animation: "spin 0.8s linear infinite" }}
			>
				<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
				<circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 10" />
			</svg>
			Loading…
		</div>
	);
}
