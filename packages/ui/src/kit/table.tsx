import { cn } from "cn";
import type { ComponentProps } from "react";

/** A table on a unit (components.md · Table); statuses are lamps. */
const Table = ({ className, ...props }: ComponentProps<"table">) => (
  <div data-slot="table-container" className="relative w-full overflow-x-auto">
    <table data-slot="table" className={cn("o-table", className)} {...props} />
  </div>
);

const TableHeader = (props: ComponentProps<"thead">) => (
  <thead data-slot="table-header" {...props} />
);

const TableBody = (props: ComponentProps<"tbody">) => (
  <tbody data-slot="table-body" {...props} />
);

const TableRow = (props: ComponentProps<"tr">) => (
  <tr data-slot="table-row" {...props} />
);

const TableHead = (props: ComponentProps<"th">) => (
  <th data-slot="table-head" {...props} />
);

const TableCell = (props: ComponentProps<"td">) => (
  <td data-slot="table-cell" {...props} />
);

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
