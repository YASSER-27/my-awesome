import { useRef, useEffect, type ReactNode } from 'react'
import { useDockStore, type PanelZone } from './dockStore'

interface DockContainerProps {
  zone: PanelZone
  children: ReactNode
  style?: React.CSSProperties
  className?: string
}

export function DockContainer({ zone, children, style, className }: DockContainerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const draggedPanelId = useDockStore(s => s.draggedPanelId)
  const dragOverZone = useDockStore(s => s.dragOverZone)
  const setDragOverZone = useDockStore(s => s.setDragOverZone)

  useEffect(() => {
    if (!draggedPanelId) return
    const el = ref.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top && e.clientY <= rect.bottom
      if (isOver) {
        setDragOverZone(zone)
      } else if (useDockStore.getState().dragOverZone === zone) {
        setDragOverZone(null)
      }
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [draggedPanelId, zone, setDragOverZone])

  const isOver = draggedPanelId && dragOverZone === zone

  return (
    <div ref={ref} data-zone={zone} className={className} style={{
      ...style,
      position: 'relative',
      transition: 'box-shadow .15s',
      boxShadow: isOver ? 'inset 0 0 0 2px rgba(102,126,234,0.5)' : 'none',
      borderRadius: isOver ? 4 : 0,
    }}>
      {children}
      {isOver && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(102,126,234,0.06)',
          borderRadius: 4, pointerEvents: 'none', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 10, color: '#667eea', fontWeight: 600 }}>Drop to swap</span>
        </div>
      )}
    </div>
  )
}
