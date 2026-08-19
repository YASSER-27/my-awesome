import { useState } from 'react'
import { useAppStore } from '../../../store'
import { SavedImport } from '../../../types'

export function ImportsPanel() {
  const savedImports = useAppStore((s) => s.savedImports)
  const deleteSavedImport = useAppStore((s) => s.deleteSavedImport)
  const renameSavedImport = useAppStore((s) => s.renameSavedImport)
  const addCanvasElement = useAppStore((s) => s.addCanvasElement)
  const addConnection = useAppStore((s) => s.addConnection)
  const canvasElements = useAppStore((s) => s.canvasElements)
  const selectElement = useAppStore((s) => s.selectElement)
  const [renamingImportId, setRenamingImportId] = useState<string | null>(null)
  const [renameImportValue, setRenameImportValue] = useState('')

  const handleImportClick = (imp: SavedImport) => {
    const newEl = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      componentId: 'saved-' + imp.id,
      x: 100 + Math.random() * 200, y: 100 + Math.random() * 200,
      width: 360, height: 240,
      name: imp.name, category: 'My Imports', type: 'import' as const,
      html: imp.html, css: imp.css, js: imp.js, source: imp.source, mode: 'source' as const,
      description: `Saved import (${imp.source})`,
    }
    addCanvasElement(newEl)
    if (canvasElements.length > 0) {
      addConnection({ id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), fromId: canvasElements[canvasElements.length - 1].id, toId: newEl.id })
    }
    selectElement(newEl.id)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {savedImports.length > 0 && (
        <div className="sidebar-imports" style={{ flex: 1, overflow: 'hidden auto' }}>
          {savedImports.map((imp) => (
            <div key={imp.id} className="sidebar-import-item" onClick={() => handleImportClick(imp)} title={`${imp.name} (${imp.source})`}>
              {renamingImportId === imp.id ? (
                <input autoFocus className="sidebar-import-rename-input" value={renameImportValue}
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
      )}
    </div>
  )
}
