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
  default: "o-btn o-btn-primary",
  destructive: "o-btn o-btn-danger",
  ghost: "o-btn o-btn-ghost",
  link: "o-link",
  outline: "o-btn",
  secondary: "o-btn",
};
const sizes: Record<Size, string> = {
  default: "",
  icon: "o-btn-icon",
  "icon-lg": "o-btn-icon",
  "icon-sm": "o-btn-icon o-btn-sm",
  "icon-xs": "o-btn-icon o-btn-sm",
  lg: "",
  pill: "",
  sm: "o-btn-sm",
  xs: "o-btn-sm",
};

/** A button: a slip over its hatched shadow (packages/ui/components.md · Button). `default` is the primary one. */
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
