import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";

/** A slide switch in a recessed slot (components.md · Switch); behaviour from Base UI. */
const Switch = ({
  className,
  size: _size,
  ...props
}: SwitchPrimitive.Root.Props & { size?: "sm" | "default" }) => (
  <SwitchPrimitive.Root
    data-slot="switch"
    className={cn("o-slot flex-none cursor-pointer border-0 p-0", className)}
    {...props}
  >
    <SwitchPrimitive.Thumb data-slot="switch-thumb" className="o-thumb" />
  </SwitchPrimitive.Root>
);

export { Switch };
