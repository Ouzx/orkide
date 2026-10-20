import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cn } from "cn";

/** A round portrait in a milled bezel. */
const Avatar = ({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & { size?: "default" | "sm" | "lg" }) => (
  <AvatarPrimitive.Root
    data-slot="avatar"
    data-size={size}
    className={cn(
      "o-avatar data-[size=lg]:size-10 data-[size=sm]:size-6",
      className
    )}
    {...props}
  />
);

const AvatarImage = ({ className, ...props }: AvatarPrimitive.Image.Props) => (
  <AvatarPrimitive.Image
    data-slot="avatar-image"
    className={cn("aspect-square size-full object-cover", className)}
    {...props}
  />
);

const AvatarFallback = ({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) => (
  <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={cn(
      "flex size-full items-center justify-center bg-paper-2 font-mono text-sm font-bold text-ink",
      className
    )}
    {...props}
  />
);

export { Avatar, AvatarFallback, AvatarImage };
