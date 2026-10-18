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

/** Which lamp a badge lights (components.md · Lamp). */
const tones: Record<Variant, string | undefined> = {
  default: "ok",
  destructive: "hot",
  ghost: undefined,
  link: undefined,
  outline: undefined,
  secondary: "warn",
};

/** A status read-out: a lamp and an engraved label. */
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
        children: (
          <>
            <span
              className="o-lamp"
              data-tone={tones[variant]}
              aria-hidden="true"
            />
            {children}
          </>
        ),
        className: cn("o-lampline", className),
      },
      props
    ),
    render,
    state: { slot: "badge", variant },
  });

export { Badge };
