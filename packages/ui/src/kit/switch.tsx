import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";

/** A toggle: a slot with a square thumb (components.md · Toggle); behaviour from Base UI. */
const Switch = ({
  className,
  size: _size,
  ...props
}: SwitchPrimitive.Root.Props & { size?: "sm" | "default" }) => (
  <SwitchPrimitive.Root
    data-slot="switch"
    className={cn("o-toggle", className)}
    {...props}
  >
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className="o-toggle-thumb"
    />
  </SwitchPrimitive.Root>
);

export { Switch };
