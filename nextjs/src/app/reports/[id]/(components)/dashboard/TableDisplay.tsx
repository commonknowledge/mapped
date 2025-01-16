import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import { useExplorerState } from '@/lib/map'
import { allKeysFromAllData } from '@/lib/utils'
import { useMemo } from 'react'

export function TableDisplay({
  data,
  config,
  title,
  areaName,
}: {
  data: any[]
  config: {
    columns?: string[]
  }
  title: string
  areaName: string
}) {
  const [_, setExplorerState] = useExplorerState()

  const cols: string[] = useMemo(() => {
    const columns = config?.columns || allKeysFromAllData(data)
    return columns
  }, [config, data])

  const dataTableColumns = useMemo(() => {
    if (cols.length === 0) {
      const firstItem = data[0]
      if (firstItem) {
        return Object.keys(firstItem).map(
          (col) =>
            ({
              header: col,
              accessorKey: col,
            }) satisfies ColumnDef<any>
        )
      }
    }
    return cols.map(
      (col) =>
        ({
          header: col,
          accessorKey: col,
        }) satisfies ColumnDef<any>
    )
  }, [cols, data])

  const table = useReactTable({
    data: data,
    columns: dataTableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleRowClick = (row: any) => {
    setExplorerState({
      entity: 'record',
      id: row.id,
      showExplorer: true,
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="max-h-[20vh] overflow-y-auto bg-meepGray-700 rounded-md">
        {table.getRowModel().rows.map((row) => {
          const nameCell = row
            .getVisibleCells()
            .find(
              (cell) => cell.column.id === 'name' || cell.column.id === 'Name'
            )
          const postcodeCell = row
            .getVisibleCells()
            .find(
              (cell) =>
                cell.column.id === 'postcode' ||
                cell.column.id === 'Postcode' ||
                cell.column.id === 'POSTCODE'
            )
          return (
            <div
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              onClick={() => handleRowClick(row.original)}
            >
              {nameCell && (
                <div
                  key={nameCell.id}
                  className="text-meepGray-200 justify-between flex font-mono text-sm hover:bg-meepGray-800 p-2 cursor-pointer border-b border-meepGray-800"
                >
                  {flexRender(
                    nameCell.column.columnDef.cell,
                    nameCell.getContext()
                  )}
                  {postcodeCell && (
                    <span className="text-meepGray-400 font-mono text-sm">
                      {flexRender(
                        postcodeCell.column.columnDef.cell,
                        postcodeCell.getContext()
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {data.length > 0 && (
        <Dialog>
          <DialogTrigger className="w-full mt-2">
            <Button className="w-full">Open full table</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] w-[96vw] max-w-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex gap-4 items-end">
                {areaName}
                <div className="text-meepGray-400">
                  <span className="text-meepGray-400 font-mono text-sm uppercase">
                    Data Source:
                    <span className="text-meepGray-200 ">
                      {title} ({data.length} rows)
                    </span>
                  </span>
                </div>
              </DialogTitle>
              <DialogDescription>
                <Table>
                  <TableHeader className="text-meepGray-400 font-mono uppercase">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody className="text-meepGray-400 font-mono">
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
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
                          colSpan={dataTableColumns.length}
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
