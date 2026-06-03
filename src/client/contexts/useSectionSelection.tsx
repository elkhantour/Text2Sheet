import React, { useContext, createContext, useCallback, useMemo, useState } from "react";

export interface SectionContextValue {
	activeSectionId: string | null;
	setActiveSection: (sectionId: string | null) => void;
	isSectionActive: (sectionId: string) => boolean;
}

export const SectionSelectionContext = createContext<SectionContextValue | null>(null);


interface Props {
	children: React.ReactNode;
}

export function SectionSelectionProvider({ children }: Props) {
	const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

	const setActiveSection = useCallback((sectionId: string | null) => {
		setActiveSectionId(sectionId);
	}, []);

	const isSectionActive = useCallback(
		(sectionId: string) => activeSectionId === sectionId,
		[activeSectionId]
	);

	const value = useMemo(
		() => ({
			activeSectionId,
			setActiveSection,
			isSectionActive,
		}),
		[activeSectionId, setActiveSection, isSectionActive]
	);

	return (
		<SectionSelectionContext.Provider value={value}>
			{children}
		</SectionSelectionContext.Provider>
	);
}

export function useSectionSelection() {
	const context = useContext(SectionSelectionContext);

	if (!context) {
		throw new Error(
			"useSectionSelection must be used within a SectionSelectionProvider"
		);
	}

	return context;
}
