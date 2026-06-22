import { usePlugin } from "@contexts/usePlugin";
import { Spinner } from "@radix-ui/themes";
import { ICON_SIZE_EXTRA_SMALL } from "@utils/constants";
import { CheckCheckIcon, InfoIcon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";


export function Toast(): React.ReactElement {
	const [visible, setVisible] = useState(false);

	const {
		dismissToast,
		toast,
	} = usePlugin();


	useEffect(() => {
		requestAnimationFrame(() => setVisible(true));
	}, []);

	if (!toast)
		return <></>;

	return (
		<div
			onClick={dismissToast}
			data-visible={visible}
			data-kind={toast.kind}
			className="
                            	absolute
                            	bottom-[50px]
                            	left-1/2
                            	-translate-x-1/2
                            	z-50
                            
                            	inline-flex
                            	w-fit
                            	max-w-[calc(100%-1.5rem)]
                            
                            	cursor-pointer
                            	items-center
                            	gap-2
                            	rounded-md
                            	border
                            	px-3
                            	py-2.5
                            
                            	text-xs
                            	leading-relaxed
                            	shadow-lg
                            
                            	opacity-0
                            	translate-y-2
                            	transition-all
                            	duration-200

                        
                        	data-[visible=true]:opacity-100
                        	data-[visible=true]:translate-y-0
                        
                        	/* Error */
                        	data-[kind=ERROR]:bg-red-950
                        	data-[kind=ERROR]:border-red-800
                        	data-[kind=ERROR]:text-red-300
                        
                        	/* Success */
                        	data-[kind=SUCCESS]:bg-green-950
                        	data-[kind=SUCCESS]:border-green-800
                        	data-[kind=SUCCESS]:text-green-300
                        
                        	/* Info */
                        	data-[kind=INFO]:bg-blue-950
                        	data-[kind=INFO]:border-blue-800
                        	data-[kind=INFO]:text-blue-300
                        
                        	/* Loading */
                        	data-[kind=LOADING]:bg-zinc-900
                        	data-[kind=LOADING]:border-zinc-700
                        	data-[kind=LOADING]:text-zinc-300
                     	">
			{
				toast.kind === "ERROR" ? <XIcon size={ICON_SIZE_EXTRA_SMALL} />
					: toast.kind === "SUCCESS" ? <CheckCheckIcon size={ICON_SIZE_EXTRA_SMALL} />
						: toast.kind === "LOADING" ? <Spinner size="1" />
							: <InfoIcon size={ICON_SIZE_EXTRA_SMALL} />
			}

			<span>{toast.message}</span>
		</div>
	);
}
