import { cn } from "cn";
import type { ComponentProps } from "react";

/** An admin unit (components.md · Unit). */
const Card = ({
  className,
  size = "default",
  ...props
}: ComponentProps<"div"> & { size?: "default" | "sm" }) => (
  <div
    data-slot="card"
    data-size={size}
    className={cn(
      "o-unit flex flex-col gap-4 py-4.5 data-[size=sm]:gap-3 data-[size=sm]:py-3",
      className
    )}
    {...props}
  />
);

const CardHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-header"
    className={cn(
      "grid auto-rows-min items-start gap-1 px-4.5 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
      className
    )}
    {...props}
  />
);

const CardTitle = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-title"
    className={cn("o-unit-title", className)}
    {...props}
  />
);

const CardDescription = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-description"
    className={cn("text-md text-ink-2", className)}
    {...props}
  />
);

const CardAction = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-action"
    className={cn(
      "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
      className
    )}
    {...props}
  />
);

const CardContent = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-content"
    className={cn("px-4.5", className)}
    {...props}
  />
);

const CardFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-footer"
    className={cn(
      "flex items-center border-t border-line px-4.5 pt-3.5",
      className
    )}
    {...props}
  />
);

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
