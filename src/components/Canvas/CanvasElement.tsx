import { useRef, useCallback, useState } from 'react'
import { useDrag } from 'react-dnd'
import { useAppStore } from '../../store'
import { CanvasElement } from '../../types'
import ComponentPreview from '../common/ComponentPreview'
import './CanvasElement.css'

interface Props {
  element: CanvasElement
  index: number
  isSelected: boolean
}

function extractCodeFromResult(text: string): { html: string; css: string } {
  let html = text
  let css = ''
  const cssMatch = text.match(/```css\n([\s\S]*?)```/)
  if (cssMatch) css = cssMatch[1]
  const htmlMatch = text.match(/```html\n([\s\S]*?)```/)
  if (htmlMatch) html = htmlMatch[1]
  if (!htmlMatch) {
    const genericMatch = text.match(/```(?:\w*)\n([\s\S]*?)```/)
    if (genericMatch) html = genericMatch[1]
  }
  const docMatch = html.match(/<!DOCTYPE html>[\s\S]*?<body>[\s\S]*?<\/body>/i)
  if (docMatch) {
    const bodyContent = docMatch[0].match(/<body>([\s\S]*)<\/body>/i)
    if (bodyContent) html = bodyContent[1]
  }
  return { html, css }
}

function CanvasElementComponent({ element, index, isSelected }: Props) {
  const updateCanvasElement = useAppStore((s) => s.updateCanvasElement)
  const removeCanvasElement = useAppStore((s) => s.removeCanvasElement)
  const selectElement = useAppStore((s) => s.selectElement)
  const saveImport = useAppStore((s) => s.saveImport)
  const canvasMode = useAppStore((s) => s.canvasMode)
  const ref = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement | null>
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 })
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ html: string; css: string } | null>(null)
  const [showAiResult, setShowAiResult] = useState(false)
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [, drag] = useDrag(() => ({
    type: 'CANVAS_ELEMENT',
    item: { id: element.id },
  }), [element.id])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    selectElement(element.id)
    dragStart.current = { x: e.clientX, y: e.clientY, elX: element.x, elY: element.y }
    setIsDragging(true)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStart.current.x
      const dy = moveEvent.clientY - dragStart.current.y
      updateCanvasElement(element.id, {
        x: dragStart.current.elX + dx,
        y: dragStart.current.elY + dy,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [element.id, element.x, element.y, selectElement, updateCanvasElement])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    removeCanvasElement(element.id)
  }, [element.id, removeCanvasElement])

  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    selectElement(element.id)
  }, [element.id, selectElement])

  const handleAiEdit = useCallback(async () => {
    const prompt = aiInput.trim()
    if (!prompt) return
    setAiLoading(true)
    setShowAiResult(false)
    setAiResult(null)
    setSaved(false)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const userMsg = `Edit this component:\n\nCSS:\n${element.css}\n\nHTML:\n${element.html}\n\nUser request: ${prompt}\n\nReturn the updated HTML and CSS. Keep the same component type but apply the requested changes. Output inside markdown code blocks.`

    try {
      const res = await fetch('http://127.0.0.1:8080/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek',
          messages: [
            { role: 'system', content: 'You are a UI component editor. Edit the component based on the user request. Output CSS in a ```css block and HTML in a ```html block. Keep the response concise.' },
            { role: 'user', content: userMsg },
          ],
          stream: false,
          temperature: 0.3,
          max_tokens: 4096,
        }),
        signal: abortRef.current.signal,
      })
      if (!res.ok) throw new Error('Server not running')
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content || ''
      const extracted = extractCodeFromResult(text)
      if (extracted.html || extracted.css) {
        setAiResult(extracted)
        setShowAiResult(true)
      } else {
        setAiResult({ html: text, css: element.css })
        setShowAiResult(true)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setAiResult({ html: `<span style="color:#f44;font-size:12px">Error: ${err.message}</span>`, css: '' })
      setShowAiResult(true)
    }
    setAiLoading(false)
    abortRef.current = null
  }, [aiInput, element.css, element.html])

  const handleSave = useCallback(() => {
    if (!aiResult) return
    const newHtml = aiResult.html || element.html
    const newCss = aiResult.css || element.css
    updateCanvasElement(element.id, { html: newHtml, css: newCss })
    saveImport({
      name: element.name + ' (edited)',
      html: newHtml,
      css: newCss,
      source: 'ai',
    })
    setSaved(true)
    setTimeout(() => {
      setShowAiResult(false)
      setAiResult(null)
      setAiInput('')
      setSaved(false)
    }, 1500)
  }, [aiResult, element, updateCanvasElement, saveImport])

  const handleAiKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !aiLoading) {
      e.preventDefault()
      handleAiEdit()
    }
  }

  const discardResult = useCallback(() => {
    setShowAiResult(false)
    setAiResult(null)
    setAiInput('')
  }, [])

  return (
    <div
      ref={(node) => { ref.current = node; drag(node) }}
      className={`canvas-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${canvasMode === 'description' ? 'description-mode' : ''}`}
      style={{ left: element.x, top: element.y, width: element.width, height: element.height }}
      onMouseDown={handleMouseDown}
      onClick={handleSelect}
    >
      <div className="ce-header">
        <span className="ce-label">#{index + 1} {element.name}</span>
        <div className="ce-actions">
          <span className="ce-mode-indicator">{canvasMode === 'source' ? '</>' : '(i)'}</span>
          <button className="ce-delete-btn" onClick={handleDelete} title="Delete">x</button>
        </div>
      </div>
      <div className="ce-body">
        {showAiResult && aiResult ? (
          <div className="ce-ai-result">
            <div className="ce-ai-result-header">
              <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>AI Edit Preview</span>
              <button onClick={discardResult}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 10, padding: 0 }}>✕</button>
            </div>
            <ComponentPreview html={aiResult.html} css={aiResult.css} maxHeight={100} />
          </div>
        ) : canvasMode === 'source' ? (
          <ComponentPreview html={element.html} css={element.css} js={element.js} />
        ) : (
          <div className="ce-description">
            <div className="ce-desc-header">
              <span className="ce-desc-name">{element.name}</span>
              <span className="ce-desc-type">{element.type}</span>
            </div>
            <p className="ce-desc-text">{element.description}</p>
            <div className="ce-desc-meta">
              <span>Category: {element.category}</span>
              <span>Position: ({Math.round(element.x)}, {Math.round(element.y)})</span>
            </div>
          </div>
        )}
      </div>
      <div className="ce-ai-bar">
        {showAiResult && aiResult && (
          <button onClick={handleSave}
            style={{
              width: '100%', padding: '4px 8px', fontSize: 10, fontWeight: 600,
              background: saved ? 'rgba(34,197,94,0.2)' : 'rgba(74,222,128,0.12)',
              border: saved ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(74,222,128,0.2)',
              borderRadius: 6, color: saved ? '#22c55e' : '#4ade80',
              cursor: 'pointer', marginBottom: 4, transition: 'all .15s',
            }}
          >{saved ? '✓ Saved to Imports' : 'Save to Import'}</button>
        )}
        <div className="ce-ai-input-row">
          <textarea ref={textareaRef} value={aiInput}
            onChange={e => { setAiInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 48) + 'px' }}
            onKeyDown={handleAiKeyDown}
            rows={1} placeholder="Ask AI to edit this component..."
            style={{
              flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6,
              color: '#ccc', fontSize: 10, padding: '4px 8px', fontFamily: 'inherit',
              resize: 'none', outline: 'none', lineHeight: 1.4, maxHeight: 48,
            }}
            disabled={aiLoading}
          />
          <button onClick={handleAiEdit} disabled={!aiInput.trim() || aiLoading}
            style={{
              padding: '4px 8px', background: aiLoading ? 'rgba(255,255,255,0.05)' : 'rgba(102,126,234,0.2)',
              border: aiLoading ? '1px solid #2a2a2a' : '1px solid rgba(102,126,234,0.3)',
              borderRadius: 6, color: aiLoading ? '#666' : '#667eea',
              cursor: aiLoading ? 'default' : 'pointer', fontSize: 10, fontWeight: 600,
              whiteSpace: 'nowrap', transition: 'all .15s',
            }}
          >{aiLoading ? '...' : 'Edit'}</button>
        </div>
      </div>
      <div className="ce-connectors">
        <div className="ce-connector top" />
        <div className="ce-connector right" />
        <div className="ce-connector bottom" />
        <div className="ce-connector left" />
      </div>
    </div>
  )
}

export default CanvasElementComponent