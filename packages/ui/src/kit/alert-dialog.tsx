import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { cn } from "cn";
import type { ComponentProps } from "react";

import { Button } from "./button.tsx";

/** A confirmation panel (components.md · Confirm); behaviour from Base UI. */
const AlertDialog = (props: AlertDialogPrimitive.Root.Props) => (
  <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
);
const AlertDialogTrigger = (props: AlertDialogPrimitive.Trigger.Props) => (
  <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
);
const AlertDialogPortal = (props: AlertDialogPrimitive.Portal.Props) => (
  <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
);
const AlertDialogOverlay = ({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) => (
  <AlertDialogPrimitive.Backdrop
    data-slot="alert-dialog-overlay"
    className={cn("o-backdrop", className)}
    {...props}
  />
);

const AlertDialogContent = ({
  className,
  size = "default",
  ...props
}: AlertDialogPrimitive.Popup.Props & { size?: "default" | "sm" }) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Popup
      data-slot="alert-dialog-content"
      data-size={size}
      className={cn(
        "o-popup fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 p-6 sm:max-w-sm",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
);

const AlertDialogHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="alert-dialog-header"
    className={cn("grid gap-2", className)}
    {...props}
  />
);

const AlertDialogFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="alert-dialog-footer"
    className={cn(
      "flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
);

const AlertDialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Title>) => (
  <AlertDialogPrimitive.Title
    data-slot="alert-dialog-title"
    className={cn("o-card-title", className)}
    {...props}
  />
);

const AlertDialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Description>) => (
  <AlertDialogPrimitive.Description
    data-slot="alert-dialog-description"
    className={cn("text-md text-ink-2", className)}
    {...props}
  />
);

const AlertDialogAction = (props: ComponentProps<typeof Button>) => (
  <Button data-slot="alert-dialog-action" {...props} />
);

const AlertDialogCancel = ({
  className,
  variant = "outline",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<ComponentProps<typeof Button>, "variant" | "size">) => (
  <AlertDialogPrimitive.Close
    data-slot="alert-dialog-cancel"
    className={cn(className)}
    render={<Button variant={variant} size={size} />}
    {...props}
  />
);

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
};
