import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cn } from "cn";

/** A row of latching keys in a recessed slot (components.md · Switch, Tabs). */
const ToggleGroup = ({
  className,
  variant: _variant,
  size: _size,
  spacing: _spacing,
  orientation = "horizontal",
  ...props
}: ToggleGroupPrimitive.Props & {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  spacing?: number;
  orientation?: "horizontal" | "vertical";
}) => (
  <ToggleGroupPrimitive
    data-slot="toggle-group"
    data-orientation={orientation}
    className={cn("o-tabs data-vertical:flex-col", className)}
    {...props}
  />
);

const ToggleGroupItem = ({
  className,
  variant: _variant,
  size: _size,
  ...props
}: TogglePrimitive.Props & {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}) => (
  <TogglePrimitive
    data-slot="toggle-group-item"
    className={cn("o-tab", className)}
    {...props}
  />
);

export { ToggleGroup, ToggleGroupItem };
