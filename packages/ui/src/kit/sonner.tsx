import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner } from "sonner";
import type { ToasterProps } from "sonner";

// Sonner would inject this as a runtime <style>, which the hashed CSP blocks; patches/sonner.patch
// turns that off and the stylesheet ships with the bundle instead.
import "sonner/dist/styles.css";

/** Toasts as transmittal slips on the sheet (components.md · Toast). */
const Toaster = (props: ToasterProps) => (
  <Sonner
    className="o-toaster"
    icons={{
      error: <OctagonXIcon className="size-4" />,
      info: <InfoIcon className="size-4" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
      success: <CircleCheckIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
    }}
    {...props}
  />
);

export { Toaster };
