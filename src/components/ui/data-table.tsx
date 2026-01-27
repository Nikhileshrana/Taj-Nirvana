"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Search, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  rightActions?: React.ReactNode;
  leftActions?: React.ReactNode;
  customSearch?: React.ReactNode;
  enableReordering?: boolean;
  onReorder?: (newOrder: TData[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey = "name",
  searchPlaceholder = "Search...",
  onRowClick,
  loading = false,
  rightActions,
  leftActions,
  customSearch,
  enableReordering = false,
  onReorder,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Drag and Drop State
  const [localData, setLocalData] = React.useState(data);
  const [draggedRowIndex, setDraggedRowIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRowIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image ghost-like (optional)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedRowIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedRowIndex === null) return;
    if (draggedRowIndex === dropIndex) return;

    const newData = [...localData];
    const [draggedItem] = newData.splice(draggedRowIndex, 1);
    newData.splice(dropIndex, 0, draggedItem);

    setLocalData(newData);
    if (onReorder) onReorder(newData);
    setDraggedRowIndex(null);
  };

  const table = useReactTable({
    data: enableReordering ? localData : data,
    columns: React.useMemo(() => {
      if (!enableReordering) return columns;
      const dragColumn: ColumnDef<TData, TValue> = {
        id: "drag-handle",
        header: "",
        cell: ({ row }) => (
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, row.index)}
            onDragEnd={handleDragEnd}
            className="cursor-grab active:cursor-grabbing flex items-center justify-center text-muted-foreground hover:text-foreground w-8"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      };
      return [dragColumn, ...columns];
    }, [columns, enableReordering, localData]),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: customSearch ? undefined : getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    state: {
      sorting,
      columnFilters: customSearch ? [] : columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {customSearch ? (
          customSearch
        ) : (
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={
                (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-8 w-full"
            />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          {leftActions}
          <div className="sm:block hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {rightActions}
        </div>
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-accent"
              >
                {headerGroup.headers.map((header, index) => {
                  const isFirst = index === 0;
                  const isLast = index === headerGroup.headers.length - 1;
                  return (
                    <TableHead
                      key={header.id}
                      className={`text-foreground ${isFirst ? "rounded-tl-md" : ""
                        } ${isLast ? "rounded-tr-md" : ""}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              // Show skeleton rows for loading state
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((column, colIndex) => {
                    // Vary skeleton widths for more realistic appearance
                    const widths = [
                      "w-full",
                      "w-3/4",
                      "w-1/2",
                      "w-2/3",
                      "w-4/5",
                    ];
                    const widthClass = widths[colIndex % widths.length];
                    return (
                      <TableCell key={`skeleton-cell-${index}-${colIndex}`}>
                        <Skeleton className={`h-8 ${widthClass}`} />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={
                    (onRowClick ? "cursor-pointer hover:bg-muted/50 " : "") +
                    "truncate max-w-[200px]"
                  }
                  onDragOver={(e) => enableReordering && handleDragOver(e)}
                  onDrop={(e) => enableReordering && handleDrop(e, row.index)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="truncate max-w-[200px]">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </p>
            <p className="text-sm text-muted-foreground">
              ({table.getFilteredRowModel().rows.length} total items)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// Status Badge Component
export function StatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}) {
  const getVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "available":
      case "completed":
      case "received":
        return "default";
      case "pending":
      case "processing":
        return "secondary";
      case "cancelled":
      case "damaged":
      case "out of stock":
        return "destructive";
      default:
        return "outline";
    }
  };

  return <Badge variant={getVariant(status)}>{status}</Badge>;
}

// Boolean Badge Component
export function BooleanBadge({ value }: { value: boolean }) {
  return (
    <Badge variant={value ? "default" : "secondary"}>
      {value ? "Yes" : "No"}
    </Badge>
  );
}
