import { cn } from "cn";
import type { ComponentProps } from "react";

/** A multi-line field well (components.md · Field). */
const Textarea = ({ className, ...props }: ComponentProps<"textarea">) => (
  <textarea
    data-slot="textarea"
    className={cn("o-input", className)}
    {...props}
  />
);

export { Textarea };
