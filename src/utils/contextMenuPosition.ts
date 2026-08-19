export interface ContextMenuAnchor {
  x: number
  y: number
}

export interface ContextMenuPosition {
  left: number
  top: number
}

export function getContextMenuPosition(
  mouseX: number,
  mouseY: number,
  menuWidth: number,
  menuHeight: number,
  padding = 8,
): ContextMenuPosition {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = mouseX
  let top = mouseY

  if (mouseX + menuWidth > viewportWidth) {
    left = mouseX - menuWidth
  }

  if (mouseY + menuHeight > viewportHeight) {
    top = mouseY - menuHeight
  }

  left = Math.max(padding, Math.min(left, viewportWidth - menuWidth - padding))
  top = Math.max(padding, Math.min(top, viewportHeight - menuHeight - padding))

  return { left, top }
}
