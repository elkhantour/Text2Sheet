import { CheckedState } from "@radix-ui/react-checkbox";

export const CheckboxStateToBool = (e: CheckedState) => e != 'indeterminate' ? e : false
