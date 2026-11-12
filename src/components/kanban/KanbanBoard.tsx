import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

/** Clicks this soon after a drag ends are the drop itself, not a deliberate click. */
const CLICK_SUPPRESS_MS = 300

export interface KanbanColumn {
  id: string
  title: string
}

export interface KanbanBoardProps<T> {
  columns: readonly KanbanColumn[]
  items: readonly T[]
  getItemId: (item: T) => string
  getItemColumn: (item: T) => string
  renderCard: (item: T) => ReactNode
  /** Called when a card is dropped on a different column. */
  onMove: (itemId: string, columnId: string) => void
  emptyText?: string
  label: string
  /** Optional handle on the scrolling container (for "previous / next stages" buttons). */
  scrollRef?: RefObject<HTMLDivElement | null>
}

function DraggableItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
      }
      className={cn(
        'mb-2.5 cursor-grab touch-manipulation',
        isDragging && 'relative z-10 opacity-90 shadow-dialog',
      )}
    >
      {children}
    </div>
  )
}

function Column({
  column,
  count,
  emptyText,
  children,
}: {
  column: KanbanColumn
  count: number
  emptyText: string
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <section
      ref={setNodeRef}
      aria-label={`${column.title}, ${count} items`}
      className={cn(
        'bg-column border-line border-t-brand rounded-card min-h-[420px] w-[285px] flex-none border border-t-[3px]',
        isOver && 'ring-brand ring-2',
      )}
    >
      <div className="bg-surface-alt border-line flex items-center justify-between border-b p-4">
        <b>{column.title}</b>
        <Badge tone="neutral">{count}</Badge>
      </div>
      <div className="p-2.5">
        {children}
        {count === 0 && <p className="text-subtle m-0 px-4 py-10 text-center">{emptyText}</p>}
      </div>
    </section>
  )
}

/** Drag-and-drop board. Pointer, touch and keyboard sensors are enabled. */
export function KanbanBoard<T>({
  columns,
  items,
  getItemId,
  getItemColumn,
  renderCard,
  onMove,
  emptyText = 'Drag opportunities here',
  label,
  scrollRef,
}: KanbanBoardProps<T>) {
  const sensors = useSensors(
    // A small distance lets clicks on cards (links) still work.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  // After a drop the browser fires a click on the card's link, which would open the record.
  // dnd-kit already calls stopPropagation() on that click at document (capture) but not
  // preventDefault(), so the link's default navigation still runs, and no element-level
  // listener ever sees the event. Cancel the default at window (capture), which runs first.
  // A timer-based reset is unreliable here: it can fire before the click is dispatched.
  const dragEndedAt = useRef(0)
  useEffect(() => {
    const cancelDropClick = (event: MouseEvent) => {
      if (performance.now() - dragEndedAt.current < CLICK_SUPPRESS_MS) event.preventDefault()
    }
    window.addEventListener('click', cancelDropClick, true)
    return () => window.removeEventListener('click', cancelDropClick, true)
  }, [])
  const endDrag = () => {
    dragEndedAt.current = performance.now()
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    endDrag()
    if (!over) return
    const item = items.find((candidate) => getItemId(candidate) === active.id)
    if (item && getItemColumn(item) !== over.id) onMove(String(active.id), String(over.id))
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragCancel={endDrag}>
      <div
        ref={scrollRef}
        role="group"
        aria-label={label}
        className="flex gap-3.5 overflow-auto pb-3"
      >
        {columns.map((column) => {
          const columnItems = items.filter((item) => getItemColumn(item) === column.id)
          return (
            <Column
              key={column.id}
              column={column}
              count={columnItems.length}
              emptyText={emptyText}
            >
              {columnItems.map((item) => (
                <DraggableItem key={getItemId(item)} id={getItemId(item)}>
                  {renderCard(item)}
                </DraggableItem>
              ))}
            </Column>
          )
        })}
      </div>
    </DndContext>
  )
}
