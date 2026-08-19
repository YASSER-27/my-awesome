import { useCallback, type ReactNode } from 'react'
import { useDockStore, type PanelId, type PanelZone } from './dockStore'

interface DockPanelProps {
  panelId: PanelId
  title: string
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  headerExtra?: ReactNode
}

export function DockPanel({ panelId, title, children, className, style, headerExtra }: DockPanelProps) {
  const draggedPanelId = useDockStore(s => s.draggedPanelId)
  const startDrag = useDockStore(s => s.startDrag)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    let moved = false

    // Find source zone from closest [data-zone]
    const zoneEl = el.closest('[data-zone]') as HTMLElement | null
    const fromZone = (zoneEl?.dataset?.zone || 'left') as PanelZone
    const store = useDockStore.getState()
    store.startDrag(panelId, fromZone)

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        moved = true
      }
    }
    const onUp = () => {
      el.releasePointerCapture(e.pointerId)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      if (moved) {
        useDockStore.getState().endDrag()
      } else {
        useDockStore.getState().cancelDrag?.()
      }
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
  }, [panelId, startDrag])

  return (
    <div className={className} style={{
      ...style,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      opacity: draggedPanelId === panelId ? 0.3 : 1,
      transition: 'opacity .15s',
    }}>
      <div onPointerDown={onPointerDown} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '2px 6px', cursor: 'grab', userSelect: 'none',
        flexShrink: 0, touchAction: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="9" cy="5" r="1.5" fill="#555" stroke="none" />
          <circle cx="15" cy="5" r="1.5" fill="#555" stroke="none" />
          <circle cx="9" cy="12" r="1.5" fill="#555" stroke="none" />
          <circle cx="15" cy="12" r="1.5" fill="#555" stroke="none" />
          <circle cx="9" cy="19" r="1.5" fill="#555" stroke="none" />
          <circle cx="15" cy="19" r="1.5" fill="#555" stroke="none" />
        </svg>
        <span style={{ fontSize: 9, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
        {headerExtra}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
