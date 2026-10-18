import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "cn";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

/** A menu on a floating panel (components.md · Menu); behaviour from Base UI. */
const DropdownMenu = (props: MenuPrimitive.Root.Props) => (
  <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
);
const DropdownMenuPortal = (props: MenuPrimitive.Portal.Props) => (
  <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
);
const DropdownMenuTrigger = (props: MenuPrimitive.Trigger.Props) => (
  <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
);

const DropdownMenuContent = ({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 6,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) => (
  <MenuPrimitive.Portal>
    <MenuPrimitive.Positioner
      className="isolate z-50 outline-none"
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
    >
      <MenuPrimitive.Popup
        data-slot="dropdown-menu-content"
        className={cn(
          "o-popup o-popup-menu max-h-(--available-height) origin-(--transform-origin) overflow-y-auto",
          className
        )}
        {...props}
      />
    </MenuPrimitive.Positioner>
  </MenuPrimitive.Portal>
);

const DropdownMenuGroup = (props: MenuPrimitive.Group.Props) => (
  <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
);

const DropdownMenuLabel = ({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & { inset?: boolean }) => (
  <MenuPrimitive.GroupLabel
    data-slot="dropdown-menu-label"
    data-inset={inset}
    className={cn("o-eng block px-2.5 py-1.5 data-inset:pl-8", className)}
    {...props}
  />
);

const DropdownMenuItem = ({
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) => (
  <MenuPrimitive.Item
    data-slot="dropdown-menu-item"
    data-inset={inset}
    data-variant={variant}
    className={cn("o-item data-inset:pl-8", className)}
    {...props}
  />
);

const DropdownMenuSub = (props: MenuPrimitive.SubmenuRoot.Props) => (
  <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
);

const DropdownMenuSubTrigger = ({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & { inset?: boolean }) => (
  <MenuPrimitive.SubmenuTrigger
    data-slot="dropdown-menu-sub-trigger"
    data-inset={inset}
    className={cn("o-item data-inset:pl-8", className)}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto" />
  </MenuPrimitive.SubmenuTrigger>
);

const DropdownMenuSubContent = ({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  ...props
}: ComponentProps<typeof DropdownMenuContent>) => (
  <DropdownMenuContent
    data-slot="dropdown-menu-sub-content"
    align={align}
    alignOffset={alignOffset}
    side={side}
    sideOffset={sideOffset}
    {...props}
  />
);

const DropdownMenuCheckboxItem = ({
  className,
  children,
  checked,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & { inset?: boolean }) => (
  <MenuPrimitive.CheckboxItem
    data-slot="dropdown-menu-checkbox-item"
    data-inset={inset}
    className={cn("o-item pr-8", className)}
    checked={checked}
    {...props}
  >
    <span className="pointer-events-none absolute right-2.5 flex items-center">
      <MenuPrimitive.CheckboxItemIndicator>
        <CheckIcon />
      </MenuPrimitive.CheckboxItemIndicator>
    </span>
    {children}
  </MenuPrimitive.CheckboxItem>
);

const DropdownMenuRadioGroup = (props: MenuPrimitive.RadioGroup.Props) => (
  <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
);

const DropdownMenuRadioItem = ({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.RadioItem.Props & { inset?: boolean }) => (
  <MenuPrimitive.RadioItem
    data-slot="dropdown-menu-radio-item"
    data-inset={inset}
    className={cn("o-item pr-8", className)}
    {...props}
  >
    <span className="pointer-events-none absolute right-2.5 flex items-center">
      <MenuPrimitive.RadioItemIndicator>
        <CheckIcon />
      </MenuPrimitive.RadioItemIndicator>
    </span>
    {children}
  </MenuPrimitive.RadioItem>
);

const DropdownMenuSeparator = ({
  className,
  ...props
}: MenuPrimitive.Separator.Props) => (
  <MenuPrimitive.Separator
    data-slot="dropdown-menu-separator"
    className={cn("-mx-1.5 my-1.5 h-px bg-line", className)}
    {...props}
  />
);

const DropdownMenuShortcut = ({
  className,
  ...props
}: ComponentProps<"span">) => (
  <span
    data-slot="dropdown-menu-shortcut"
    className={cn("ml-auto font-mono text-xs text-ink-2", className)}
    {...props}
  />
);

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
