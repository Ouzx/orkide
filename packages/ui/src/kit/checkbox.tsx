import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";

/** A small recessed key that lights when checked (components.md · Check). */
const Checkbox = ({ className, ...props }: CheckboxPrimitive.Root.Props) => (
  <CheckboxPrimitive.Root
    data-slot="checkbox"
    className={cn("o-check border-0 p-0", className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      data-slot="checkbox-indicator"
      className="grid place-content-center"
    >
      <CheckIcon />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);

export { Checkbox };
