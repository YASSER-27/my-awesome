import { useState, useMemo, useRef, useEffect, memo } from 'react'
import { useDrag } from 'react-dnd'
import { useAppStore } from '../../../store'
import { ComponentItem, CanvasElement } from '../../../types'
import ComponentPreview from '../../common/ComponentPreview'
import { createPortal } from 'react-dom'

interface DraggableProps {
  component: ComponentItem
  onClick: (c: ComponentItem) => void
  onShowPreview: (c: ComponentItem, rect: DOMRect) => void
  onMovePreview: (rect: DOMRect) => void
  onHidePreview: () => void
}

const DraggableComponent = memo(({ component, onClick, onShowPreview, onMovePreview, onHidePreview }: DraggableProps) => {
  const [, drag] = useDrag(() => ({
    type: 'COMPONENT',
    item: () => {
      const newEl: CanvasElement = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        componentId: component.id,
        x: 0, y: 0,
        width: 360, height: 240,
        name: component.name,
        category: component.category,
        type: component.type,
        html: component.html,
        css: component.css,
        js: component.js,
        source: component.source,
        description: component.description,
        mode: 'source',
      }
      return newEl
    },
  }))
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const localTarget = useRef<HTMLElement | null>(null)
  useEffect(() => () => { if (localTimer.current) clearTimeout(localTimer.current) }, [])
  return (
    <div ref={drag} className="sidebar-component" onClick={() => onClick(component)}
      draggable={false} onDragStart={e => e.preventDefault()}
      onPointerEnter={(e) => {
        if (localTimer.current) clearTimeout(localTimer.current)
        const target = e.currentTarget as HTMLElement
        localTarget.current = target
        localTimer.current = setTimeout(() => {
          if (localTarget.current === target) {
            const rect = target.getBoundingClientRect()
            onShowPreview(component, rect)
          }
        }, 200)
      }}
      onPointerMove={() => { if (localTarget.current) onMovePreview(localTarget.current.getBoundingClientRect()) }}
      onPointerLeave={() => { if (localTimer.current) clearTimeout(localTimer.current); onHidePreview() }}
    >
      <span className="component-name">{component.name}</span>
      <span className="component-type">{component.type}</span>
    </div>
  )
})

export function CategoriesPanel({ search }: { search?: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [hoveredComponent, setHoveredComponent] = useState<ComponentItem | null>(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })
  const hoverTimeRef = useRef(0)

  const categories = useAppStore((s) => s.categories)
  const addCanvasElement = useAppStore((s) => s.addCanvasElement)
  const selectElement = useAppStore((s) => s.selectElement)
  const canvasElements = useAppStore((s) => s.canvasElements)
  const addConnection = useAppStore((s) => s.addConnection)

  useEffect(() => {
    const iv = setInterval(() => {
      if (hoveredComponent && Date.now() - hoverTimeRef.current > 1000) setHoveredComponent(null)
    }, 500)
    return () => clearInterval(iv)
  }, [hoveredComponent])

  const filteredCategories = useMemo(() => {
    const q = (search || '').toLowerCase().trim()
    if (!q) return categories
    return categories.map((cat) => ({
      ...cat,
      components: cat.components.filter(
        (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.components.length > 0)
  }, [search, categories])

  const toggleCategory = (name: string) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }))

  const handleComponentClick = (component: ComponentItem) => {
    const newEl: CanvasElement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      componentId: component.id,
      x: 100 + Math.random() * 200, y: 100 + Math.random() * 200,
      width: 360, height: 240,
      name: component.name, category: component.category,
      type: component.type, html: component.html, css: component.css, js: component.js,
      source: component.source, description: component.description, mode: 'source',
    }
    addCanvasElement(newEl)
    if (canvasElements.length > 0) {
      addConnection({ id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), fromId: canvasElements[canvasElements.length - 1].id, toId: newEl.id })
    }
    selectElement(newEl.id)
  }

  const handleShowPreview = (c: ComponentItem, rect: DOMRect) => { setHoverPos({ x: rect.right + 12, y: rect.top }); hoverTimeRef.current = Date.now(); setHoveredComponent(c) }
  const handleMovePreview = (rect: DOMRect) => setHoverPos(p => p.x === rect.right + 12 && p.y === rect.top ? p : { x: rect.right + 12, y: rect.top })
  const handleHidePreview = () => { hoverTimeRef.current = Date.now() }

  return (
    <>
      <div className="sidebar-categories" style={{ flex: 1, overflow: 'hidden auto' }}>
        {filteredCategories.map((category) => (
          <div key={category.name} className="category-group">
            <div className="category-header" onClick={() => toggleCategory(category.name)}>
              <span className="category-name">{category.name}</span>
              <span className="category-count">{category.components.length}</span>
              <span className={`category-arrow ${expanded[category.name] ? 'expanded' : ''}`}>{'>'}</span>
            </div>
            {expanded[category.name] && (
              <div className="category-components">
                {category.components.map((component) => (
                  <DraggableComponent key={component.id} component={component}
                    onClick={handleComponentClick}
                    onShowPreview={handleShowPreview} onMovePreview={handleMovePreview} onHidePreview={handleHidePreview}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {hoveredComponent && createPortal(
        <div className="sidebar-hover-preview" style={{
          position: 'fixed', left: Math.min(hoverPos.x, window.innerWidth - 210),
          top: Math.min(hoverPos.y, window.innerHeight - 130), zIndex: 99999,
          width: 200, height: 120, background: '#1a1a1a', border: '1px solid #333',
          borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }}>
          <div style={{ padding: '4px 8px', fontSize: 10, color: '#aaa', borderBottom: '1px solid #2a2a2a', background: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hoveredComponent.name}
          </div>
          <div style={{ height: 82, overflow: 'hidden', padding: 4 }}>
            <ComponentPreview html={hoveredComponent.html} css={hoveredComponent.css} js={hoveredComponent.js} maxHeight={82} />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
