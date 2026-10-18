import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "./button.tsx";

/** A panel over the page (components.md · Dialog); behaviour from Base UI. */
const Dialog = (props: DialogPrimitive.Root.Props) => (
  <DialogPrimitive.Root data-slot="dialog" {...props} />
);
const DialogTrigger = (props: DialogPrimitive.Trigger.Props) => (
  <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
);
const DialogPortal = (props: DialogPrimitive.Portal.Props) => (
  <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
);
const DialogClose = (props: DialogPrimitive.Close.Props) => (
  <DialogPrimitive.Close data-slot="dialog-close" {...props} />
);
const DialogOverlay = ({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) => (
  <DialogPrimitive.Backdrop
    data-slot="dialog-overlay"
    className={cn("o-backdrop", className)}
    {...props}
  />
);

const DialogContent = ({
  className,
  children,
  closeLabel,
  ...props
}: DialogPrimitive.Popup.Props & {
  /** The translated label of the corner close button; without it there is none. */
  closeLabel?: string;
}) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Popup
      data-slot="dialog-content"
      className={cn(
        "o-popup fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto p-6 sm:max-w-md",
        className
      )}
      {...props}
    >
      {children}
      {closeLabel && (
        <DialogPrimitive.Close
          data-slot="dialog-close"
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3"
            />
          }
        >
          <XIcon />
          <span className="sr-only">{closeLabel}</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Popup>
  </DialogPortal>
);

const DialogHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="dialog-header"
    className={cn("grid gap-2 pr-8", className)}
    {...props}
  />
);

const DialogFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="dialog-footer"
    className={cn(
      "flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
);

const DialogTitle = ({ className, ...props }: DialogPrimitive.Title.Props) => (
  <DialogPrimitive.Title
    data-slot="dialog-title"
    className={cn("o-unit-title text-lg", className)}
    {...props}
  />
);

const DialogDescription = ({
  className,
  ...props
}: DialogPrimitive.Description.Props) => (
  <DialogPrimitive.Description
    data-slot="dialog-description"
    className={cn("text-md text-ink-2", className)}
    {...props}
  />
);

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
