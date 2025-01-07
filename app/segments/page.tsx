"use client";

import fetchSegments from "@/app/actions/fetchSegments";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import type { Segment } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ACTIVITY_TYPES = ["all", "Run", "Ride", "Hike"];

export default function SegmentsPage() {
  const router = useRouter();

  const [activityType, setActivityType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["segments", activityType, page, sorting],
    queryFn: () =>
      fetchSegments(
        activityType,
        page,
        pageSize,
        sorting[0]?.id,
        sorting[0]?.desc ? "desc" : "asc"
      ),
    placeholderData: (prev) => prev,
  });

  const segments = data?.segments || [];

  const columns: ColumnDef<Segment>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: (info) => info.getValue(),
    },
    {
      accessorFn: (row) =>
        [row.city, row.state, row.country].filter(Boolean).join(", "),
      id: "location",
      header: "Location",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "activityType",
      header: "Activity Type",
    },
    {
      accessorFn: (row) => row.distance / 1000,
      id: "distance",
      header: "Distance",
      cell: (info) => `${info.getValue().toFixed(1)}km`,
    },
    {
      accessorFn: (row) => ({
        avg: row.averageGrade,
        max: row.maximumGrade,
      }),
      id: "grade",
      header: "Avg/Max Grade",
      cell: (info) =>
        `${info.getValue().avg?.toFixed(1)}% / ${info
          .getValue()
          .max?.toFixed(1)}%`,
    },
    {
      accessorFn: (row) => ({
        low: row.elevationLow,
        high: row.elevationHigh,
      }),
      id: "elevation",
      header: "Elev (Low/High)",
      cell: (info) =>
        `${info.getValue().low?.toFixed(0)}m / ${info
          .getValue()
          .high?.toFixed(0)}m`,
    },
    {
      accessorKey: "climbCategory",
      header: "Climb Cat",
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "athleteCount",
      header: "Athletes",
      cell: (info) => info.getValue()?.toLocaleString(),
    },
    {
      accessorKey: "effortCount",
      header: "Efforts",
      cell: (info) => info.getValue()?.toLocaleString(),
    },
    {
      accessorKey: "starCount",
      header: "Stars",
      cell: (info) => info.getValue()?.toLocaleString(),
    },
  ];

  const table = useReactTable({
    data: segments,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
    manualSorting: true,
    pageCount: Math.ceil((data?.segmentCountsTotal || 0) / pageSize),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleClick = (segmentId: string) => {
    router.push(`/segments/${segmentId}`);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Segments</h1>
        <Select value={activityType} onValueChange={setActivityType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Activity Type" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase cursor-pointer select-none"
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-[250px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[50px] ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px] ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px] ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[30px] ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[50px] ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[50px] ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[50px] ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
              : table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleClick(row.original.id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          Page {page} of {table.getPageCount()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
