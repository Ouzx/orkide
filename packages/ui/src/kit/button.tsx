import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "cn";

type Variant =
  | "default"
  | "destructive"
  | "ghost"
  | "link"
  | "outline"
  | "secondary";
type Size =
  | "default"
  | "icon"
  | "icon-lg"
  | "icon-sm"
  | "icon-xs"
  | "lg"
  | "pill"
  | "sm"
  | "xs";

const variants: Record<Variant, string> = {
  default: "o-key o-key-signal",
  destructive: "o-key o-key-danger",
  ghost: "o-key o-key-ghost",
  link: "o-link",
  outline: "o-key",
  secondary: "o-key",
};
const sizes: Record<Size, string> = {
  default: "",
  icon: "o-key-icon",
  "icon-lg": "o-key-icon",
  "icon-sm": "o-key-icon o-key-sm",
  "icon-xs": "o-key-icon o-key-sm",
  lg: "",
  pill: "",
  sm: "o-key-sm",
  xs: "o-key-sm",
};

/** A keycap (packages/ui/components.md · Key). `default` is the signal key. */
const buttonVariants = ({
  className,
  size = "default",
  variant = "default",
}: {
  className?: string;
  size?: Size | null;
  variant?: Variant | null;
} = {}) =>
  cn(
    variants[variant ?? "default"],
    variant === "link" ? "" : sizes[size ?? "default"],
    className
  );

const Button = ({
  className,
  variant = "default",
  size = "default",
  ...props
}: Omit<ButtonPrimitive.Props, "className"> & {
  className?: string;
  variant?: Variant;
  size?: Size;
}) => (
  <ButtonPrimitive
    data-slot="button"
    className={buttonVariants({ className, size, variant })}
    {...props}
  />
);

export { Button, buttonVariants };
