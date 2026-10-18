import { cn } from "cn";
import type { ComponentProps } from "react";

/** An engraved field label (components.md · Field). */
const Label = ({ className, ...props }: ComponentProps<"label">) => (
  // The control is associated by the caller (`htmlFor` or nesting).
  // oxlint-disable-next-line jsx-a11y/label-has-associated-control
  <label
    data-slot="label"
    className={cn("o-label flex items-center gap-2", className)}
    {...props}
  />
);

export { Label };
