import { cn } from "cn";
import type { ComponentProps } from "react";

/** A placeholder while data loads: an unlit, breathing segment. */
const Skeleton = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="skeleton"
    className={cn("o-skeleton", className)}
    {...props}
  />
);

export { Skeleton };
