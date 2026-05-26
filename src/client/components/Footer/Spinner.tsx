import React from "react";

export function Spinner(): React.ReactElement {
	return (
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
			<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
			<circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 10" />
		</svg>
	);
}
