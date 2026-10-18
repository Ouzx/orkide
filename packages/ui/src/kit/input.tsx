import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import type { ComponentProps } from "react";

/** A field well (components.md · Field). */
const Input = ({ className, ...props }: ComponentProps<"input">) => (
  <InputPrimitive
    data-slot="input"
    className={cn("o-well", className)}
    {...props}
  />
);

export { Input };
