import React, { useContext, createContext, useCallback, useMemo, useState } from "react";

export interface SectionContextValue {
	activeSectionId: string | null;
	setActiveSection: (sectionId: string | null) => void;
	isSectionActive: (sectionId: string) => boolean;
}

export const SectionContext = createContext<SectionContextValue | null>(null);


interface Props {
	children: React.ReactNode;
}

export function SectionProvider({ children }: Props) {
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
		<SectionContext.Provider value={value}>
			{children}
		</SectionContext.Provider>
	);
}

export function useSection() {
	const context = useContext(SectionContext);

	if (!context) {
		throw new Error(
			"useSection must be used within a SectionProvider"
		);
	}

	return context;
}
