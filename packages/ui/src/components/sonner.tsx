import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";
import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { Toaster as Sonner } from "sonner";
import type { ToasterProps } from "sonner";

// Sonner would inject this as a runtime <style>, which the hashed CSP blocks; patches/sonner.patch
// turns that off and the stylesheet ships with the bundle instead.
import "sonner/dist/styles.css";

// Orkide: follow the `.dark` class the theme switch sets on <html> (no next-themes).
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  return () => observer.disconnect();
};
const getTheme = (): "dark" | "light" =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useSyncExternalStore(
    subscribe,
    getTheme,
    () => "light" as const
  );

  return (
    <Sonner
      theme={theme}
      className="group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
