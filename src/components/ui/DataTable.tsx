import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import type { KeyboardEvent, ReactNode } from 'react'
import { palette, radius } from '@/theme/tokens'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** CSS width for the column (e.g. `"20%"` or `140`). */
  width?: string | number
  align?: 'left' | 'right' | 'center'
}

export interface DataTableProps<T> {
  columns: readonly Column<T>[]
  rows: readonly T[]
  getRowId: (row: T) => string
  /** Accessible name for the table. */
  label: string
  onRowClick?: (row: T) => void
  emptyMessage?: string
  /** Minimum width before the table scrolls horizontally. */
  minWidth?: number
  /** Lets users drag column edges to resize (fixed table layout). */
  resizable?: boolean
  selectedRowId?: string
  dense?: boolean
}

/** Generic, accessible table used by every list and field grid in the app. */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  label,
  onRowClick,
  emptyMessage = 'Nothing to show.',
  minWidth = 640,
  resizable = false,
  selectedRowId,
  dense = false,
}: DataTableProps<T>) {
  const handleKey = (event: KeyboardEvent, row: T) => {
    if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onRowClick(row)
    }
  }

  return (
    <TableContainer
      sx={{
        border: `1px solid ${palette.line}`,
        borderRadius: radius.card,
        backgroundColor: palette.surface,
      }}
    >
      <Table
        aria-label={label}
        size={dense ? 'small' : 'medium'}
        sx={{ minWidth, tableLayout: resizable ? 'fixed' : 'auto' }}
      >
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align}
                scope="col"
                sx={{
                  width: column.width,
                  ...(resizable && { resize: 'horizontal', overflow: 'auto', minWidth: 120 }),
                }}
              >
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <EmptyState>{emptyMessage}</EmptyState>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const id = getRowId(row)
              return (
                <TableRow
                  key={id}
                  hover
                  selected={id === selectedRowId}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (event) => handleKey(event, row) : undefined}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:last-child td': { borderBottom: 0 },
                    '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: palette.brandTint },
                    '&:hover': { backgroundColor: palette.brandTint },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
