import type { ReactNode } from 'react'
import { useContextMenuPosition } from '../../hooks/useContextMenuPosition'
import type { ContextMenuAnchor } from '../../utils/contextMenuPosition'

interface ContextMenuProps {
  anchor: ContextMenuAnchor | null
  contentKey?: string | number | null
  className?: string
  children: ReactNode
}

export default function ContextMenu({
  anchor,
  contentKey,
  className = '',
  children,
}: ContextMenuProps) {
  const { menuRef, position, isPositioned } = useContextMenuPosition(anchor, contentKey)

  if (!anchor) return null

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 w-[220px] max-w-[260px] ${className}`.trim()}
      style={{
        left: position?.left ?? anchor.x,
        top: position?.top ?? anchor.y,
        visibility: isPositioned ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  )
}