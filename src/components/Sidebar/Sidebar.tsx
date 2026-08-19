import { useState, useMemo, useRef, useEffect, memo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useDrag } from 'react-dnd'
import { useAppStore, TOOLS } from '../../store'
import { ComponentItem, CanvasElement, SavedImport } from '../../types'
import ComponentPreview from '../common/ComponentPreview'
import ImportModal from '../ImportModal/ImportModal'
import './Sidebar.css'

interface DraggableProps {
  component: ComponentItem;
  onClick: (c: ComponentItem) => void;
  onShowPreview: (c: ComponentItem, rect: DOMRect) => void;
  onMovePreview: (rect: DOMRect) => void;
  onHidePreview: () => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
}

const DraggableComponent = memo(({ component, onClick, onShowPreview, onMovePreview, onHidePreview, favoriteIds, onToggleFavorite }: DraggableProps) => {
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
      draggable={false}
      onDragStart={e => e.preventDefault()}
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
      onPointerMove={() => {
        if (localTarget.current) {
          const rect = localTarget.current.getBoundingClientRect()
          onMovePreview(rect)
        }
      }}
      onPointerLeave={() => {
        if (localTimer.current) clearTimeout(localTimer.current)
        onHidePreview()
      }}
    >
      <span className={`sidebar-star${favoriteIds.includes('comp:' + component.id) ? ' active' : ''}`}
        onClick={e => { e.stopPropagation(); onToggleFavorite('comp:' + component.id) }}>
        {favoriteIds.includes('comp:' + component.id) ? '★' : '☆'}
      </span>
      <span className="component-name">{component.name}</span>
      <span className="component-type">{component.type}</span>
    </div>
  )
})

function SidebarComponent() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const showImport = useAppStore((s) => s.showImportModal)
  const setShowImport = useAppStore((s) => s.setShowImportModal)
  const hoverTimeRef = useRef(0)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const resizingRef = useRef(false)
  const categories = useAppStore((s) => s.categories)
  const addCanvasElement = useAppStore((s) => s.addCanvasElement)
  const selectElement = useAppStore((s) => s.selectElement)
  const [hoveredComponent, setHoveredComponent] = useState<ComponentItem | null>(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })
  const [toolsHeight, setToolsHeight] = useState(200)
  const [importsHeight, setImportsHeight] = useState(180)
  const resizeToolsRef = useRef(false)
  const resizeImportsRef = useRef(false)
  const [navTab, setNavTab] = useState<'all' | 'tools' | 'categories' | 'imports' | 'favorites'>('all')
  const [showNav, setShowNav] = useState(true)
  const showNavRef = useRef(true)

  // Ctrl+H toggle nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault()
        showNavRef.current = !showNavRef.current
        setShowNav(showNavRef.current)
        if (showNavRef.current) setNavTab('all')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Force hide hover preview after 2.5s regardless of mouse position
  useEffect(() => {
    const iv = setInterval(() => {
      if (hoveredComponent && Date.now() - hoverTimeRef.current > 1000) {
        setHoveredComponent(null)
      }
    }, 500)
    return () => clearInterval(iv)
  }, [hoveredComponent])

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase()
    return categories
      .map((cat) => ({
        ...cat,
        components: cat.components.filter(
          (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.components.length > 0)
  }, [search, categories])

  const toggleCategory = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const canvasElements = useAppStore((s) => s.canvasElements)
  const addConnection = useAppStore((s) => s.addConnection)

  const handleComponentClick = (component: ComponentItem) => {
    const newEl: CanvasElement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      componentId: component.id,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 360,
      height: 240,
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
    addCanvasElement(newEl)
    const currentEls = canvasElements
    if (currentEls.length > 0) {
      addConnection({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        fromId: currentEls[currentEls.length - 1].id,
        toId: newEl.id,
      })
    }
    selectElement(newEl.id)
  }

  const handleShowPreview = (component: ComponentItem, rect: DOMRect) => {
    setHoverPos({ x: rect.right + 12, y: rect.top })
    hoverTimeRef.current = Date.now()
    setHoveredComponent(component)
  }

  const handleMovePreview = (rect: DOMRect) => {
    setHoverPos(p =>
      p.x === rect.right + 12 && p.y === rect.top ? p : { x: rect.right + 12, y: rect.top }
    )
  }

  const handleHidePreview = () => {
    hoverTimeRef.current = Date.now()
  }

  const savedImports = useAppStore((s) => s.savedImports)
  const deleteSavedImport = useAppStore((s) => s.deleteSavedImport)
  const renameSavedImport = useAppStore((s) => s.renameSavedImport)
  const favoriteIds = useAppStore((s) => s.favoriteIds)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const [renamingImportId, setRenamingImportId] = useState<string | null>(null)
  const [renameImportValue, setRenameImportValue] = useState('')

  const handleImportClick = (imp: SavedImport) => {
    const newEl: CanvasElement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      componentId: 'saved-' + imp.id,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 360,
      height: 240,
      name: imp.name,
      category: 'My Imports',
      type: 'import',
      html: imp.html,
      css: imp.css,
      js: imp.js,
      description: `Saved import (${imp.source})`,
      source: imp.source,
      mode: 'source',
    }
    addCanvasElement(newEl)
    const currentEls = canvasElements
    if (currentEls.length > 0) {
      addConnection({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        fromId: currentEls[currentEls.length - 1].id,
        toId: newEl.id,
      })
    }
    selectElement(newEl.id)
  }

  const handleSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = true
    const startX = e.clientX
    const startW = sidebarWidth
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const newW = Math.max(180, Math.min(500, startW + ev.clientX - startX))
      setSidebarWidth(newW)
    }
    const onUp = () => { resizingRef.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [sidebarWidth])

  const handleToolsResize = (e: React.MouseEvent) => {
    if (showNav) return
    e.preventDefault()
    resizeToolsRef.current = true
    const startY = e.clientY
    const startH = toolsHeight
    const onMove = (ev: MouseEvent) => {
      if (!resizeToolsRef.current) return
      const newH = Math.max(80, Math.min(500, startH + (ev.clientY - startY)))
      setToolsHeight(newH)
    }
    const onUp = () => { resizeToolsRef.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleImportsResize = (e: React.MouseEvent) => {
    if (showNav) return
    e.preventDefault()
    resizeImportsRef.current = true
    const startY = e.clientY
    const startH = importsHeight
    const onMove = (ev: MouseEvent) => {
      if (!resizeImportsRef.current) return
      const newH = Math.max(60, Math.min(400, startH - (ev.clientY - startY)))
      setImportsHeight(newH)
    }
    const onUp = () => { resizeImportsRef.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="sidebar" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
      <div className="sidebar-resize-handle" onMouseDown={handleSidebarResize} />
      <div className="sidebar-header">
        <h1 className="sidebar-title">My Awesome</h1>
        <span className="sidebar-author">by Yasser-27</span>
      </div>
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>
      {/* Nav tabs */}
      {showNav && (
        <div className="sidebar-nav">
          <div className={`sidebar-nav-t${navTab === 'all' ? ' act' : ''}`} onClick={() => setNavTab('all')}>All</div>
          <div className={`sidebar-nav-t${navTab === 'tools' ? ' act' : ''}`} onClick={() => setNavTab('tools')}>Tools</div>
          <div className={`sidebar-nav-t${navTab === 'categories' ? ' act' : ''}`} onClick={() => setNavTab('categories')}>Categories</div>
          <div className={`sidebar-nav-t${navTab === 'imports' ? ' act' : ''}`} onClick={() => setNavTab('imports')}>Imports</div>
          <div className={`sidebar-nav-t${navTab === 'favorites' ? ' act' : ''}`} onClick={() => setNavTab('favorites')}>Favorites</div>
        </div>
      )}
      <div className="sidebar-scroll">
      {/* Tools section */}
      {(!showNav || navTab === 'all' || navTab === 'tools') && (
      <div className="sidebar-tools" style={{ height: showNav ? 'auto' : toolsHeight, overflow: 'hidden auto', flexShrink: 0 }}>
        <div className="sidebar-tools-header">
          <span className="sidebar-tools-title">Tools</span>
        </div>
        {TOOLS.map((tool) => (
          <div key={tool.name} className="sidebar-tool-item"
            onClick={() => useAppStore.getState().setActiveTool(tool.name)}
          >
            <span className={`sidebar-star${favoriteIds.includes('tool:' + tool.name) ? ' active' : ''}`}
              onClick={e => { e.stopPropagation(); toggleFavorite('tool:' + tool.name) }}
            >
              {favoriteIds.includes('tool:' + tool.name) ? '★' : '☆'}
            </span>
            <span className="sidebar-tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="14" height="14" fill="currentColor"><path d="M598.6 118.6C611.1 106.1 611.1 85.8 598.6 73.3C586.1 60.8 565.8 60.8 553.3 73.3L361.3 265.3L326.6 230.6C322.4 226.4 316.6 224 310.6 224C298.1 224 288 234.1 288 246.6L288 275.7L396.3 384L425.4 384C437.9 384 448 373.9 448 361.4C448 355.4 445.6 349.6 441.4 345.4L406.7 310.7L598.7 118.7zM373.1 417.4L254.6 298.9C211.9 295.2 169.4 310.6 138.8 341.2L130.8 349.2C108.5 371.5 96 401.7 96 433.2C96 440 103.1 444.4 109.2 441.4L160.3 415.9C165.3 413.4 169.8 420 165.7 423.8L39.3 537.4C34.7 541.6 32 547.6 32 553.9C32 566.1 41.9 576 54.1 576L227.4 576C266.2 576 303.3 560.6 330.8 533.2C361.4 502.6 376.7 460.1 373.1 417.4z"/></svg>
            </span>
            <span className="sidebar-tool-label">{tool.label}</span>
          </div>
        ))}
      </div>
      )}
      {(!showNav || navTab === 'all' || navTab === 'tools') && (
      <div className="sidebar-splitter" onMouseDown={handleToolsResize} style={{ opacity: showNav ? 0.2 : 1 }} />
      )}

      {(!showNav || navTab === 'all' || navTab === 'categories') && (
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
                    onShowPreview={handleShowPreview}
                    onMovePreview={handleMovePreview}
                    onHidePreview={handleHidePreview}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {(!showNav || navTab === 'all' || navTab === 'imports') && savedImports.length > 0 && (
        <>
          <div className="sidebar-splitter" onMouseDown={handleImportsResize} style={{ opacity: showNav ? 0.2 : 1 }} />
          <div className="sidebar-imports" style={{ height: showNav ? 'auto' : importsHeight, overflow: 'hidden auto', flexShrink: 0 }}>
          <div className="sidebar-tools-header">
            <span className="sidebar-tools-title">Import Saved</span>
          </div>
          {savedImports.map((imp) => (
            <div key={imp.id} className="sidebar-import-item" onClick={() => handleImportClick(imp)}
              title={`${imp.name} (${imp.source})`}>
              <span className={`sidebar-star${favoriteIds.includes('import:' + imp.id) ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); toggleFavorite('import:' + imp.id) }}
              >
                {favoriteIds.includes('import:' + imp.id) ? '★' : '☆'}
              </span>
              {renamingImportId === imp.id ? (
                <input
                  autoFocus
                  className="sidebar-import-rename-input"
                  value={renameImportValue}
                  onChange={e => setRenameImportValue(e.target.value)}
                  onBlur={() => { renameSavedImport(imp.id, renameImportValue); setRenamingImportId(null) }}
                  onKeyDown={e => { if (e.key === 'Enter') { renameSavedImport(imp.id, renameImportValue); setRenamingImportId(null) } else if (e.key === 'Escape') setRenamingImportId(null) }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className="sidebar-import-item-name">{imp.name}</span>
                  <span className="sidebar-import-item-source">{imp.source}</span>
                </>
              )}
              <span className="sidebar-import-item-rename" onClick={e => { e.stopPropagation(); setRenamingImportId(imp.id); setRenameImportValue(imp.name) }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </span>
              <span className="sidebar-import-item-del" onClick={e => { e.stopPropagation(); deleteSavedImport(imp.id) }}>✕</span>
            </div>
          ))}
        </div>
        </>
      )}

      {/* Favorites tab */}
      {(!showNav || navTab === 'favorites') && (
        <div className="sidebar-favorites">
          <div className="sidebar-tools-header">
            <span className="sidebar-tools-title">Favorites</span>
          </div>
          {favoriteIds.length === 0 && (
            <div style={{ padding: '12px 16px', fontSize: 11, color: '#555', textAlign: 'center' }}>
              Star items to add them here
            </div>
          )}
          {favoriteIds.map(fid => {
            if (fid.startsWith('tool:')) {
              const name = fid.slice(5)
              const tool = TOOLS.find(t => t.name === name)
              if (!tool) return null
              return (
                <div key={fid} className="sidebar-fav-item">
                  <span className={`sidebar-star active`}
                    onClick={() => toggleFavorite(fid)}>★</span>
                  <span className="sidebar-fav-label">{tool.label}</span>
                  <span className="sidebar-fav-type">Tool</span>
                </div>
              )
            }
            if (fid.startsWith('comp:')) {
              const compId = fid.slice(5)
              for (const cat of categories) {
                const comp = cat.components.find(c => c.id === compId)
                if (comp) {
                  return (
                    <div key={fid} className="sidebar-fav-item"
                      onClick={() => handleComponentClick(comp)}
                      style={{ cursor: 'pointer' }}>
                      <span className={`sidebar-star active`}
                        onClick={e => { e.stopPropagation(); toggleFavorite(fid) }}>★</span>
                      <span className="sidebar-fav-label">{comp.name}</span>
                      <span className="sidebar-fav-type">{comp.type}</span>
                    </div>
                  )
                }
              }
              return null
            }
            if (fid.startsWith('import:')) {
              const impId = fid.slice(7)
              const imp = savedImports.find(i => i.id === impId)
              if (!imp) return null
              return (
                <div key={fid} className="sidebar-fav-item"
                  onClick={() => handleImportClick(imp)}
                  style={{ cursor: 'pointer' }}>
                  <span className={`sidebar-star active`}
                    onClick={e => { e.stopPropagation(); toggleFavorite(fid) }}>★</span>
                  <span className="sidebar-fav-label">{imp.name}</span>
                  <span className="sidebar-fav-type">{imp.source}</span>
                </div>
              )
            }
            return null
          })}
        </div>
      )}

      </div>

      {/* Import Design */}
      <div className="sidebar-import">
        <div className="sidebar-import-btn" onClick={() => setShowImport(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="14" height="14" fill="currentColor"><path d="M480 400L288 400C279.2 400 272 392.8 272 384L272 128C272 119.2 279.2 112 288 112L421.5 112C425.7 112 429.8 113.7 432.8 116.7L491.3 175.2C494.3 178.2 496 182.3 496 186.5L496 384C496 392.8 488.8 400 480 400zM288 448L480 448C515.3 448 544 419.3 544 384L544 186.5C544 169.5 537.3 153.2 525.3 141.2L466.7 82.7C454.7 70.7 438.5 64 421.5 64L288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L368 496L368 512C368 520.8 360.8 528 352 528L160 528C151.2 528 144 520.8 144 512L144 256C144 247.2 151.2 240 160 240L176 240L176 192L160 192z"/></svg>
          <span>Import Design</span>
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}

      {/* Hover preview tooltip — rendered at root via portal to avoid overflow clipping */}
      {hoveredComponent && createPortal(
        <div
          className="sidebar-hover-preview"
          style={{
            position: 'fixed',
            left: Math.min(hoverPos.x, window.innerWidth - 210),
            top: Math.min(hoverPos.y, window.innerHeight - 130),
            zIndex: 99999,
            width: 200,
            height: 120,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ padding: '4px 8px', fontSize: 10, color: '#aaa', borderBottom: '1px solid #2a2a2a', background: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hoveredComponent.name}
          </div>
          <div style={{ height: 82, overflow: 'hidden', padding: 4 }}>
            <ComponentPreview html={hoveredComponent.html} css={hoveredComponent.css} js={hoveredComponent.js} maxHeight={82} />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default SidebarComponent

