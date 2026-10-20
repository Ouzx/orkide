import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "cn";

type Variant =
  | "default"
  | "destructive"
  | "ghost"
  | "link"
  | "outline"
  | "secondary";

/** The ink a badge is stamped in (components.md · Badge). */
const tones: Record<Variant, string | undefined> = {
  default: "ok",
  destructive: "danger",
  ghost: undefined,
  link: undefined,
  outline: undefined,
  secondary: "warn",
};

/** A status as a small stamp: draft, published, archived. */
const Badge = ({
  className,
  variant = "default",
  render,
  children,
  ...props
}: useRender.ComponentProps<"span"> & { variant?: Variant }) =>
  useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        children,
        className: cn("o-badge", className),
      },
      props
    ),
    render,
    // Base UI renders state as data attributes: `data-tone` picks the ink (kit.css · .o-badge).
    state: { slot: "badge", tone: tones[variant], variant },
  });

export { Badge };
