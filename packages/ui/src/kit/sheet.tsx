import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "./button.tsx";

/** A panel sliding in from an edge (components.md · Drawer); behaviour from Base UI. */
const Sheet = (props: SheetPrimitive.Root.Props) => (
  <SheetPrimitive.Root data-slot="sheet" {...props} />
);
const SheetTrigger = (props: SheetPrimitive.Trigger.Props) => (
  <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
);
const SheetClose = (props: SheetPrimitive.Close.Props) => (
  <SheetPrimitive.Close data-slot="sheet-close" {...props} />
);
const SheetPortal = (props: SheetPrimitive.Portal.Props) => (
  <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
);
const SheetOverlay = ({
  className,
  ...props
}: SheetPrimitive.Backdrop.Props) => (
  <SheetPrimitive.Backdrop
    data-slot="sheet-overlay"
    className={cn("o-backdrop", className)}
    {...props}
  />
);

const SheetContent = ({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Popup
      data-slot="sheet-content"
      data-side={side}
      className={cn(
        "fixed z-50 flex flex-col gap-4 bg-panel text-ink shadow-cast transition duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0",
        "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=top]:inset-x-0 data-[side=top]:top-0",
        "data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:w-3/4 data-[side=left]:sm:max-w-sm",
        "data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:w-3/4 data-[side=right]:sm:max-w-sm",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <SheetPrimitive.Close
          data-slot="sheet-close"
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      )}
    </SheetPrimitive.Popup>
  </SheetPortal>
);

const SheetHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="sheet-header"
    className={cn("grid gap-1 p-4", className)}
    {...props}
  />
);
const SheetFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="sheet-footer"
    className={cn("mt-auto grid gap-2 p-4", className)}
    {...props}
  />
);
const SheetTitle = ({ className, ...props }: SheetPrimitive.Title.Props) => (
  <SheetPrimitive.Title
    data-slot="sheet-title"
    className={cn("o-unit-title", className)}
    {...props}
  />
);
const SheetDescription = ({
  className,
  ...props
}: SheetPrimitive.Description.Props) => (
  <SheetPrimitive.Description
    data-slot="sheet-description"
    className={cn("text-md text-ink-2", className)}
    {...props}
  />
);

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
