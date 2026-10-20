import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import type { ComponentProps } from "react";

/** A field: a well on the sheet (components.md · Field). */
const Input = ({ className, ...props }: ComponentProps<"input">) => (
  <InputPrimitive
    data-slot="input"
    className={cn("o-input", className)}
    {...props}
  />
);

export { Input };
