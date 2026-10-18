import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "cn";

/** Keys in a recessed slot; the active one is raised and lit (components.md · Tabs). */
const Tabs = ({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) => (
  <TabsPrimitive.Root
    data-slot="tabs"
    data-orientation={orientation}
    className={cn("flex gap-3 data-horizontal:flex-col", className)}
    {...props}
  />
);

const TabsList = ({
  className,
  variant: _variant,
  ...props
}: TabsPrimitive.List.Props & { variant?: "default" | "line" }) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    className={cn("o-tabs flex-wrap", className)}
    {...props}
  />
);

const TabsTrigger = ({ className, ...props }: TabsPrimitive.Tab.Props) => (
  <TabsPrimitive.Tab
    data-slot="tabs-trigger"
    className={cn("o-tab", className)}
    {...props}
  />
);

const TabsContent = ({ className, ...props }: TabsPrimitive.Panel.Props) => (
  <TabsPrimitive.Panel
    data-slot="tabs-content"
    className={cn("flex-1 outline-none", className)}
    {...props}
  />
);

export { Tabs, TabsContent, TabsList, TabsTrigger };
