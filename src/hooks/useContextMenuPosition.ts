import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import {
  getContextMenuPosition,
  type ContextMenuAnchor,
  type ContextMenuPosition,
} from '../utils/contextMenuPosition'

export function useContextMenuPosition(
  anchor: ContextMenuAnchor | null,
  contentKey?: string | number | null,
) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<ContextMenuPosition | null>(null)

  const measure = useCallback(() => {
    if (!anchor || !menuRef.current) {
      setPosition(null)
      return
    }

    const { width, height } = menuRef.current.getBoundingClientRect()
    setPosition(getContextMenuPosition(anchor.x, anchor.y, width, height))
  }, [anchor])

  useLayoutEffect(() => {
    measure()
  }, [measure, contentKey])

  useLayoutEffect(() => {
    if (!anchor) return

    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [anchor, measure])

  return {
    menuRef,
    position,
    isPositioned: position !== null,
  }
}
