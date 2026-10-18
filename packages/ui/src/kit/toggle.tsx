import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cn } from "cn";

/** A latching key: it stays down and lit while pressed (components.md · Key). */
const toggleVariants = ({
  className,
}: {
  className?: string;
  size?: "default" | "sm" | "lg" | null;
  variant?: "default" | "outline" | null;
} = {}) => cn("o-tab", className);

const Toggle = ({
  className,
  variant: _variant,
  size: _size,
  ...props
}: Omit<TogglePrimitive.Props, "className"> & {
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}) => (
  <TogglePrimitive
    data-slot="toggle"
    className={toggleVariants({ className })}
    {...props}
  />
);

export { Toggle, toggleVariants };
