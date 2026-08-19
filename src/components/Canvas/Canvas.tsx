import { useEffect, useRef, useState, useCallback, useLayoutEffect, memo } from 'react'
import { useDrop } from 'react-dnd'
import { useAppStore, GRID_SIZE, snapToGrid, TOOLS } from '../../store'
import { CanvasElement as CanvasElementType, AiTargetNode, AiConnection, ImageNode, PromptNode, Mode27Connection, Mode27PromptConnection, PromptImageNode, Mode27ImageConnection, PROMPT_COLORS } from '../../types'
import ComponentPreview from '../common/ComponentPreview'
import ContextMenu from '../common/ContextMenu'
import JSZip from 'jszip'
import colorPaletteHtml from '../../data/tools/color-palette.html?raw'
import textGradientHtml from '../../data/tools/text-gradient-generator.html?raw'
import meshGradientHtml from '../../data/tools/mesh-gradient-generator.html?raw'
import uiStudioHtml from '../../data/tools/awsome_desinger.html?raw'
import uiLibraryHtml from '../../data/tools/UI Library.html?raw'
import vfxStudioHtml from '../../data/tools/VFX Studio.html?raw'
import colorCombinationHtml from '../../data/tools/color-combination.html?raw'
import vfxEffectsLibraryHtml from '../../data/tools/vfx_effects_library.html?raw'
import sidebarToggleHtml from '../../data/tools/sidebar-toggle.html?raw'
import pyside6StylesHtml from '../../data/tools/pyside6_styles.html?raw'
import keyframV1Html from '../../data/tools/KeyFram@ v1.html?raw'
import keyframV2Html from '../../data/tools/KeyFram@ v2.html?raw'
import templateV1Html from '../../data/tools/template V1.html?raw'
import templateV2Html from '../../data/tools/template V2.html?raw'
import CanvasAiPanel from './CanvasAiPanel'
import SettingsModal from '../SettingsModal/SettingsModal'
import QuickConfigurator from '../QuickConfigurator/QuickConfigurator'

const AI_NODE_W = 160
const AI_NODE_H = 60
const AI_NODE_MIN_W = 120
const AI_NODE_MIN_H = 48

const toolHtmlMap: Record<string, string> = {
  'color-palette': colorPaletteHtml,
  'text-gradient': textGradientHtml,
  'mesh-gradient': meshGradientHtml,
  'ui-studio': uiStudioHtml,
  'ui-library': uiLibraryHtml,
  'vfx-studio': vfxStudioHtml,
  'color-combination': colorCombinationHtml,
  'vfx-effects-library': vfxEffectsLibraryHtml,
  'sidebar-toggle': sidebarToggleHtml,
  'pyside6-styles': pyside6StylesHtml,
  'keyfram-v1': keyframV1Html,
  'keyfram-v2': keyframV2Html,
  'template-v1': templateV1Html,
  'template-v2': templateV2Html,
}

const NODE_W = 280
const NODE_H = 200
const ANCHOR_R = 10
const ANCHOR_HIT = 20

const CanvasNode = memo(({
  id, x, y, name, html, css, js, category, zoom, cam,
  isSelected, isHovered, isRenaming, renameValue, isConnecting, isAnchorDragging,
  onMouseDown, onMouseEnter, onMouseLeave, onRenameSubmit, onRenameChange, onContextMenu, onAnchorMouseDown,
}: {
  id: string; x: number; y: number; name: string;
  html: string; css: string; js?: string; category: string;
  zoom: number; cam: { x: number; y: number };
  isSelected: boolean; isHovered: boolean; isRenaming: boolean; renameValue: string; isConnecting: boolean; isAnchorDragging: boolean;
  onMouseDown: (e: React.MouseEvent, id: string, x: number, y: number) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: (id: string) => void;
  onRenameSubmit: (id: string, name: string) => void;
  onRenameChange: (value: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onAnchorMouseDown: (id: string, e: React.MouseEvent) => void;
}) => {
  const showAnchors = isHovered || isSelected
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (isRenaming) { inputRef.current?.focus(); inputRef.current?.select() } }, [isRenaming])
  return (
    <div
      draggable={false}
      className="absolute overflow-hidden select-none"
      style={{
        left: x * zoom + cam.x, top: y * zoom + cam.y,
        transform: 'scale(' + zoom + ')', transformOrigin: 'top left',
        width: NODE_W,
        background: '#121212',
        borderRadius: 12,
        border: isSelected ? '1.5px solid #4a4a4a' : '1px solid #2a2a2a',
        boxShadow: isSelected ? '0 0 8px rgba(255,255,255,0.06)' : '0 2px 8px rgba(0,0,0,0.15)',
        cursor: 'move',
        transition: 'border-color .2s, box-shadow .2s',
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseEnter={() => onMouseEnter(id)}
      onMouseLeave={() => onMouseLeave(id)}
      onMouseDown={e => onMouseDown(e, id, x, y)}
      onDragStart={e => e.preventDefault()}
      onContextMenu={e => onContextMenu(e, id)}
    >
      <div className="flex items-center px-3 py-2 gap-2" style={{ borderBottom: '1px solid #2a2a2a' }}>
        {isRenaming ? (
          <input ref={inputRef}
            className="flex-1 text-xs font-medium bg-transparent outline-none"
            style={{ color: '#e0e0e0', border: 'none', borderBottom: '1px solid #666' }}
            value={renameValue}
            onChange={e => onRenameChange(e.target.value)}
            onBlur={() => onRenameSubmit(id, renameValue)}
            onKeyDown={e => { if (e.key === 'Enter') onRenameSubmit(id, renameValue); if (e.key === 'Escape') onRenameSubmit(id, name) }}
          />
        ) : (
          <span className="flex-1 text-xs font-medium truncate" style={{ color: '#e0e0e0' }}>{name}</span>
        )}
        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#2a2a2a', color: '#888' }}>{category}</span>
      </div>
      <div style={{ height: NODE_H - 36, overflow: 'hidden' }}>
        <ComponentPreview html={html} css={css} js={js} maxHeight={NODE_H - 36} />
      </div>

      {showAnchors && <>
        <div onMouseDown={(e) => { e.stopPropagation(); onAnchorMouseDown(id, e) }} className="absolute flex items-center justify-center cursor-pointer z-20 rounded-full" style={{ left: '50%', top: -ANCHOR_HIT, marginLeft: -ANCHOR_HIT, width: ANCHOR_HIT * 2, height: ANCHOR_HIT * 2 }} title="Drag to connect">
          <div style={{ width: ANCHOR_R * 2, height: ANCHOR_R * 2, borderRadius: '50%', background: isConnecting ? '#f093fb' : '#4a4a4a', border: '1px solid', borderColor: isConnecting ? '#f093fb' : '#666', pointerEvents: 'none' }} />
        </div>
        <div onMouseDown={(e) => { e.stopPropagation(); onAnchorMouseDown(id, e) }} className="absolute flex items-center justify-center cursor-pointer z-20 rounded-full" style={{ left: '50%', bottom: -ANCHOR_HIT, marginLeft: -ANCHOR_HIT, width: ANCHOR_HIT * 2, height: ANCHOR_HIT * 2 }} title="Drag to connect">
          <div style={{ width: ANCHOR_R * 2, height: ANCHOR_R * 2, borderRadius: '50%', background: isConnecting ? '#f093fb' : '#4a4a4a', border: '1px solid', borderColor: isConnecting ? '#f093fb' : '#666', pointerEvents: 'none' }} />
        </div>
        <div onMouseDown={(e) => { e.stopPropagation(); onAnchorMouseDown(id, e) }} className="absolute flex items-center justify-center cursor-pointer z-20 rounded-full" style={{ top: '50%', left: -ANCHOR_HIT, marginTop: -ANCHOR_HIT, width: ANCHOR_HIT * 2, height: ANCHOR_HIT * 2 }} title="Drag to connect">
          <div style={{ width: ANCHOR_R * 2, height: ANCHOR_R * 2, borderRadius: '50%', background: isConnecting ? '#f093fb' : '#4a4a4a', border: '1px solid', borderColor: isConnecting ? '#f093fb' : '#666', pointerEvents: 'none' }} />
        </div>
        <div onMouseDown={(e) => { e.stopPropagation(); onAnchorMouseDown(id, e) }} className="absolute flex items-center justify-center cursor-pointer z-20 rounded-full" style={{ top: '50%', right: -ANCHOR_HIT, marginTop: -ANCHOR_HIT, width: ANCHOR_HIT * 2, height: ANCHOR_HIT * 2 }} title="Drag to connect">
          <div style={{ width: ANCHOR_R * 2, height: ANCHOR_R * 2, borderRadius: '50%', background: isConnecting ? '#f093fb' : '#4a4a4a', border: '1px solid', borderColor: isConnecting ? '#f093fb' : '#666', pointerEvents: 'none' }} />
        </div>
      </>}
    </div>
  )
})

function Canvas() {
  const canvasElements = useAppStore((s) => s.canvasElements)
  const connections = useAppStore((s) => s.connections)
  const addCanvasElement = useAppStore((s) => s.addCanvasElement)
  const addConnection = useAppStore((s) => s.addConnection)
  const removeConnection = useAppStore((s) => s.removeConnection)
  const removeCanvasElement = useAppStore((s) => s.removeCanvasElement)
  const selectElement = useAppStore((s) => s.selectElement)
  const selectedElementId = useAppStore((s) => s.selectedElementId)
  const updateElementPosition = useAppStore((s) => s.updateElementPosition)
  const updateCanvasElement = useAppStore((s) => s.updateCanvasElement)
  const setTriggerGenerate = useAppStore((s) => s.setTriggerGenerate)
  const canvasMode = useAppStore((s) => s.canvasMode)
  const setCanvasMode = useAppStore((s) => s.setCanvasMode)
  const quickMode = useAppStore((s) => s.quickMode)
  const setQuickMode = useAppStore((s) => s.setQuickMode)
  const activeTool = useAppStore((s) => s.activeTool)
  const setActiveTool = useAppStore((s) => s.setActiveTool)
  const pushUndo = useAppStore((s) => s.pushUndo)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  const aiTargetNodes = useAppStore((s) => s.aiTargetNodes)
  const aiConnections = useAppStore((s) => s.aiConnections)
  const addAiConnection = useAppStore((s) => s.addAiConnection)
  const removeAiConnection = useAppStore((s) => s.removeAiConnection)
  const updateAiTargetNodePosition = useAppStore((s) => s.updateAiTargetNodePosition)
  const updateAiTargetNodeSize = useAppStore((s) => s.updateAiTargetNodeSize)
  const removeAiTargetNode = useAppStore((s) => s.removeAiTargetNode)
  const addAiMessage = useAppStore((s) => s.addAiMessage)
  const saveImport = useAppStore((s) => s.saveImport)
  const setShowImportModal = useAppStore((s) => s.setShowImportModal)
  const showGenerateWindow = useAppStore((s) => s.showGenerateWindow)
  const toggleGenerateWindow = useAppStore((s) => s.toggleGenerateWindow)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const elementsRef = useRef(canvasElements)
  elementsRef.current = canvasElements
  const [cam, setCam] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [drag, setDrag] = useState<{ t: string; sx?: number; sy?: number; id?: string; ox?: number; oy?: number } | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renamingMode27Id, setRenamingMode27Id] = useState<string | null>(null)
  const [renameMode27Value, setRenameMode27Value] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showQuickConfig, setShowQuickConfig] = useState<boolean>(false)
  const [viewingNodeId, setViewingNodeId] = useState<string | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [showFullPage, setShowFullPage] = useState(false)
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null)
  const [editCode, setEditCode] = useState({ html: '', css: '', js: '' })
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null)
  const [connectingFromAi, setConnectingFromAi] = useState<{category: string; portIndex: number} | null>(null)
  const [anchorDrag, setAnchorDrag] = useState<{ fromId: string; portIndex?: number } | null>(null)
  const [resizingAiNode, setResizingAiNode] = useState<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null)
  const [resizingPromptNode, setResizingPromptNode] = useState<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null)
  const tempLineRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const mode27PromptConnsRef = useRef<Mode27PromptConnection[]>([])
  const [linkingImageId, setLinkingImageId] = useState<string | null>(null)
  const [linkingFromPromptId, setLinkingFromPromptId] = useState<string | null>(null)
  const [linkingFromPromptForImgId, setLinkingFromPromptForImgId] = useState<string | null>(null)
  const designer27ProjectId = useRef('proj_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6))
  const [dragImageId, setDragImageId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const camRef = useRef(cam); camRef.current = cam
  const zoomRef = useRef(zoom); zoomRef.current = zoom
  const [dragTick, setDragTick] = useState(0)
  const localPositionsRef = useRef<Record<string, {x: number, y: number}>>({})

  const setQuickGenerate = useAppStore(s => s.setQuickGenerate)
  const quickLoading = useAppStore(s => s.quickLoading)
  const setQuickLoading = useAppStore(s => s.setQuickLoading)

  const designer27Active = useAppStore(s => s.designer27Active)
  const setDesigner27Active = useAppStore(s => s.setDesigner27Active)
  const imageNodes = useAppStore(s => s.imageNodes)
  const addImageNode = useAppStore(s => s.addImageNode)
  const removeImageNode = useAppStore(s => s.removeImageNode)
  const updateImageNodePosition = useAppStore(s => s.updateImageNodePosition)
  const promptNodes = useAppStore(s => s.promptNodes)
  const addPromptNode = useAppStore(s => s.addPromptNode)
  const removePromptNode = useAppStore(s => s.removePromptNode)
  const updatePromptNode = useAppStore(s => s.updatePromptNode)
  const updatePromptNodePosition = useAppStore(s => s.updatePromptNodePosition)
  const mode27Connections = useAppStore(s => s.mode27Connections)
  const addMode27Connection = useAppStore(s => s.addMode27Connection)
  const removeMode27Connection = useAppStore(s => s.removeMode27Connection)
  const mode27Generating = useAppStore(s => s.mode27Generating)
  const setMode27Generating = useAppStore(s => s.setMode27Generating)
  const mode27Tokens = useAppStore(s => s.mode27Tokens)
  const setMode27Tokens = useAppStore(s => s.setMode27Tokens)
  const mode27Result = useAppStore(s => s.mode27Result)
  const setMode27Result = useAppStore(s => s.setMode27Result)
  const [mode27Elapsed, setMode27Elapsed] = useState(0)
  const elapseRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  useEffect(() => {
    if (mode27Generating) {
      setMode27Elapsed(0)
      elapseRef.current = setInterval(() => setMode27Elapsed(p => p + 1), 1000)
    } else {
      if (elapseRef.current) clearInterval(elapseRef.current)
      elapseRef.current = null
    }
    return () => { if (elapseRef.current) clearInterval(elapseRef.current) }
  }, [mode27Generating])
  
  const selectedMode27NodeId = useAppStore(s => s.selectedMode27NodeId)
  const setSelectedMode27NodeId = useAppStore(s => s.setSelectedMode27NodeId)
  const mode27PromptConns = useAppStore(s => s.mode27PromptConns)
  const addMode27PromptConn = useAppStore(s => s.addMode27PromptConn)
  const removeMode27PromptConn = useAppStore(s => s.removeMode27PromptConn)
  const promptImageNodes = useAppStore(s => s.promptImageNodes)
  const addPromptImageNode = useAppStore(s => s.addPromptImageNode)
  const removePromptImageNode = useAppStore(s => s.removePromptImageNode)
  const updatePromptImageNode = useAppStore(s => s.updatePromptImageNode)
  const updatePromptImageNodePosition = useAppStore(s => s.updatePromptImageNodePosition)
  const mode27ImageConns = useAppStore(s => s.mode27ImageConns)
  const addMode27ImageConn = useAppStore(s => s.addMode27ImageConn)
  const removeMode27ImageConn = useAppStore(s => s.removeMode27ImageConn)

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        // In Designer 27 mode, prioritize prompt node renaming
        if (designer27Active && selectedMode27NodeId) {
          const node = promptNodes.find(n => n.id === selectedMode27NodeId)
          if (node) {
            setRenamingMode27Id(selectedMode27NodeId)
            setRenameMode27Value(node.name)
            return
          }
        }
        // Also check if selectedElementId is a prompt node
        if (selectedElementId) {
          const promptNode = promptNodes.find(n => n.id === selectedElementId)
          if (promptNode) {
            setRenamingMode27Id(selectedElementId)
            setRenameMode27Value(promptNode.name)
            return
          }
          const el = canvasElements.find(n => n.id === selectedElementId)
          if (el) {
            setRenamingNodeId(selectedElementId)
            setRenameValue(el.name)
          }
        } else if (selectedMode27NodeId) {
          const node = promptNodes.find(n => n.id === selectedMode27NodeId)
          if (node) {
            setRenamingMode27Id(selectedMode27NodeId)
            setRenameMode27Value(node.name)
          }
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [selectedElementId, canvasElements, selectedMode27NodeId, promptNodes, designer27Active])

  // Track mouse for Mode 27 wire dragging
  useEffect(() => {
    const id = linkingImageId || linkingFromPromptId || linkingFromPromptForImgId
    if (!id || !tempLineRef.current) return
    const r = containerRef.current?.getBoundingClientRect()
    if (!r) return
    const mv = (e: MouseEvent) => {
      if (tempLineRef.current) {
        tempLineRef.current.x2 = e.clientX - r.left
        tempLineRef.current.y2 = e.clientY - r.top
        drawRef.current()
      }
    }
    const up = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect && linkingFromPromptId) {
        const mx = (e.clientX - rect.left - camRef.current.x) / zoomRef.current
        const my = (e.clientY - rect.top - camRef.current.y) / zoomRef.current
        if (mx && my) {
          const pNodes = useAppStore.getState().promptNodes
          const pConns = useAppStore.getState().mode27PromptConns
          const target = pNodes.find(pn => {
            const pnLp = localPositionsRef.current[pn.id]
            const pnX = pnLp?.x ?? pn.x; const pnY = pnLp?.y ?? pn.y
            return mx >= pnX && mx <= pnX + pn.width && my >= pnY && my <= pnY + pn.height
          })
          if (target && target.id !== linkingFromPromptId) {
            const exists = pConns.some(c => c.fromPromptId === linkingFromPromptId && c.toPromptId === target.id)
            if (!exists) {
              pushUndo()
              useAppStore.getState().addMode27PromptConn({ fromPromptId: linkingFromPromptId, toPromptId: target.id })
            }
          }
        }
      } else if (rect && linkingImageId) {
        const mx = (e.clientX - rect.left - camRef.current.x) / zoomRef.current
        const my = (e.clientY - rect.top - camRef.current.y) / zoomRef.current
        if (mx && my) {
          const pNodes = useAppStore.getState().promptNodes
          const m27Conns = useAppStore.getState().mode27Connections
          const target = pNodes.find(pn => {
            const pnLp = localPositionsRef.current[pn.id]
            const pnX = pnLp?.x ?? pn.x; const pnY = pnLp?.y ?? pn.y
            return mx >= pnX && mx <= pnX + pn.width && my >= pnY && my <= pnY + pn.height
          })
          if (target) {
            const exists = m27Conns.some(c => c.imageId === linkingImageId && c.promptId === target.id)
            if (!exists) {
              pushUndo()
              useAppStore.getState().addMode27Connection({ imageId: linkingImageId, promptId: target.id })
            }
          }
        }
      } else if (rect && linkingFromPromptForImgId) {
        const mx = (e.clientX - rect.left - camRef.current.x) / zoomRef.current
        const my = (e.clientY - rect.top - camRef.current.y) / zoomRef.current
        if (mx && my) {
          const iNodes = useAppStore.getState().imageNodes
          const m27Conns = useAppStore.getState().mode27Connections
          const target = iNodes.find(img => {
            const imgLp = localPositionsRef.current[img.id]
            const imgX = imgLp?.x ?? img.x; const imgY = imgLp?.y ?? img.y
            return mx >= imgX && mx <= imgX + img.width && my >= imgY && my <= imgY + img.height
          })
          if (target) {
            const exists = m27Conns.some(c => c.imageId === target.id && c.promptId === linkingFromPromptForImgId)
            if (!exists) {
              pushUndo()
              useAppStore.getState().addMode27Connection({ imageId: target.id, promptId: linkingFromPromptForImgId })
            }
          }
        }
      }
      tempLineRef.current = null
      setLinkingImageId(null)
      setLinkingFromPromptId(null)
      setLinkingFromPromptForImgId(null)
      drawRef.current()
    }
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
  }, [linkingImageId, linkingFromPromptId, linkingFromPromptForImgId, pushUndo])

  const onCanvasDown = (e: React.MouseEvent) => {
    setContextMenu(null)
    if (designer27Active) {
      setLinkingImageId(null)
      setLinkingFromPromptId(null)
      setLinkingFromPromptForImgId(null)
      setSelectedMode27NodeId(null)
    }
    if (renamingNodeId) { setRenamingNodeId(null); return }
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'CANVAS') {
      setDrag({ t: 'c', sx: e.clientX - cam.x, sy: e.clientY - cam.y })
      selectElement(null)
    }
  }

  const onNodeDown = useCallback((e: React.MouseEvent, id: string, x: number, y: number) => {
    e.stopPropagation()
    setContextMenu(null)
    if (renamingNodeId) { setRenamingNodeId(null); return }
    const c = camRef.current
    const z = zoomRef.current
    const rect = containerRef.current!.getBoundingClientRect()
    setDrag({
      t: 'n', id,
      ox: (e.clientX - rect.left - c.x) / z - x,
      oy: (e.clientY - rect.top - c.y) / z - y,
    })
    selectElement(id)
  }, [selectElement])

  const onAiNodeDown = useCallback((e: React.MouseEvent, id: string, x: number, y: number) => {
    e.stopPropagation()
    setContextMenu(null)
    selectElement(id)
    const c = camRef.current
    const z = zoomRef.current
    const rect = containerRef.current!.getBoundingClientRect()
    setDrag({
      t: 'ai', id,
      ox: (e.clientX - rect.left - c.x) / z - x,
      oy: (e.clientY - rect.top - c.y) / z - y,
    })
  }, [selectElement])

  const onNodeContext = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: id })
    selectElement(id)
  }, [selectElement])

  const handleRenameSubmit = useCallback((id: string, name: string) => {
    if (name.trim()) updateCanvasElement(id, { name: name.trim() })
    setRenamingNodeId(null)
  }, [updateCanvasElement])

  const handleRenameChange = useCallback((v: string) => setRenameValue(v), [])

  const onNodeEnter = useCallback((id: string) => {
    setHoveredNodeId(id)
  }, [])

  const onNodeLeave = useCallback((id: string) => {
    setHoveredNodeId(h => h === id ? null : h)
  }, [])

  const onAnchorClick = useCallback((id: string) => {
    // If AI category connection is active, connect canvas node to AI target
    if (connectingFromAi) {
      const targetNode = aiTargetNodes.find(n => n.category === connectingFromAi.category)
      if (targetNode) {
        const exists = aiConnections.some(c => c.aiTargetId === targetNode.id && c.canvasElementId === id)
        if (!exists) {
          addAiConnection({
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            aiTargetId: targetNode.id,
            canvasElementId: id,
            portIndex: connectingFromAi.portIndex,
          })
          pushUndo()
        }
      }
      setConnectingFromAi(null)
      return
    }

    if (connectingFromId === null) {
      setConnectingFromId(id)
    } else if (connectingFromId === id) {
      setConnectingFromId(null)
    } else {
      const exists = connections.some(c => (c.fromId === connectingFromId && c.toId === id) || (c.fromId === id && c.toId === connectingFromId))
      if (!exists) {
        addConnection({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          fromId: connectingFromId,
          toId: id,
        })
        pushUndo()
      }
      setConnectingFromId(null)
    }
  }, [connectingFromId, connectingFromAi, aiTargetNodes, aiConnections, connections, addConnection, addAiConnection, pushUndo])

  const onAnchorMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setAnchorDrag({ fromId: id })
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    tempLineRef.current = {
      x1: 0, y1: 0, x2: e.clientX - rect.left, y2: e.clientY - rect.top,
    }
    const pos = positionsRef.current.find(p => p.id === id)
    if (pos) {
      const aiNode = aiTargetNodes.find(n => n.id === pos.id)
      const w = aiNode ? (aiNode.width || AI_NODE_W) : NODE_W
      const h = aiNode ? (aiNode.height || AI_NODE_H) : NODE_H
      tempLineRef.current.x1 = pos.x * zoom + cam.x + w * zoom / 2
      tempLineRef.current.y1 = pos.y * zoom + cam.y + h * zoom / 2
    }
    drawRef.current()
  }, [aiTargetNodes, zoom, cam])

  const positionsRef = useRef<{id: string; x: number; y: number}[]>([])
  const curLp = localPositionsRef.current
  positionsRef.current = [
    ...canvasElements.map(e => ({ id: e.id, x: curLp[e.id]?.x ?? e.x, y: curLp[e.id]?.y ?? e.y })),
    ...aiTargetNodes.map(n => ({ id: n.id, x: curLp[n.id]?.x ?? n.x, y: curLp[n.id]?.y ?? n.y })),
    ...promptImageNodes.map(n => ({ id: n.id, x: curLp[n.id]?.x ?? n.x, y: curLp[n.id]?.y ?? n.y })),
  ]

  useEffect(() => {
    if (!drag) return
    let raf: number | null = null
    let lastClientX = 0, lastClientY = 0
    const mv = (e: MouseEvent) => {
      lastClientX = e.clientX; lastClientY = e.clientY
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = null
        if (drag.t === 'c') {
          setCam({ x: lastClientX - drag.sx!, y: lastClientY - drag.sy! })
        } else if (drag.t === 'n') {
          const c = camRef.current; const z = zoomRef.current
          const rect = containerRef.current!.getBoundingClientRect()
          const nx = (lastClientX - rect.left - c.x) / z - drag.ox!
          const ny = (lastClientY - rect.top - c.y) / z - drag.oy!
          localPositionsRef.current[drag.id!] = {x: nx, y: ny}
          const entry = positionsRef.current.find(p => p.id === drag.id)
          if (entry) { entry.x = nx; entry.y = ny }
          drawRef.current()
          setDragTick(t => t + 1)
        } else if (drag.t === 'ai') {
          const c = camRef.current; const z = zoomRef.current
          const rect = containerRef.current!.getBoundingClientRect()
          const nx = (lastClientX - rect.left - c.x) / z - drag.ox!
          const ny = (lastClientY - rect.top - c.y) / z - drag.oy!
          localPositionsRef.current[drag.id!] = {x: nx, y: ny}
          const entry = positionsRef.current.find(p => p.id === drag.id)
          if (entry) { entry.x = nx; entry.y = ny }
          drawRef.current()
          setDragTick(t => t + 1)
        } else if (drag.t === 'm27-img') {
          const c = camRef.current; const z = zoomRef.current
          const rect = containerRef.current!.getBoundingClientRect()
          const nx = (lastClientX - rect.left - c.x) / z - drag.ox!
          const ny = (lastClientY - rect.top - c.y) / z - drag.oy!
          localPositionsRef.current[drag.id!] = {x: nx, y: ny}
          drawRef.current()
          setDragTick(t => t + 1)
        } else if (drag.t === 'm27-prompt') {
          const c = camRef.current; const z = zoomRef.current
          const rect = containerRef.current!.getBoundingClientRect()
          const nx = (lastClientX - rect.left - c.x) / z - drag.ox!
          const ny = (lastClientY - rect.top - c.y) / z - drag.oy!
          localPositionsRef.current[drag.id!] = {x: nx, y: ny}
          drawRef.current()
          setDragTick(t => t + 1)
        }
      })
    }
    const up = () => {
      if (raf) cancelAnimationFrame(raf)
      const stored = localPositionsRef.current
      if (drag?.t === 'n' || drag?.t === 'ai') {
        for (const [id, p] of Object.entries(stored)) {
          if (drag.t === 'n') updateElementPosition(id, p.x, p.y)
          else if (drag.t === 'ai') updateAiTargetNodePosition(id, p.x, p.y)
        }
        localPositionsRef.current = {}
        pushUndo()
      } else if (drag?.t === 'm27-img') {
        pushUndo()
        for (const [id, p] of Object.entries(stored)) {
          updateImageNodePosition(id, p.x, p.y)
        }
        localPositionsRef.current = {}
      } else if (drag?.t === 'm27-prompt') {
        pushUndo()
        for (const [id, p] of Object.entries(stored)) {
          updatePromptNodePosition(id, p.x, p.y)
          updatePromptImageNodePosition(id, p.x, p.y)
        }
        localPositionsRef.current = {}
      }
      setDrag(null)
    }
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
  }, [drag, updateElementPosition, updateAiTargetNodePosition, updateImageNodePosition, updatePromptNodePosition, pushUndo])

  useEffect(() => {
    if (!anchorDrag) return
    const mv = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const pos = positionsRef.current.find(p => p.id === anchorDrag.fromId)
      if (pos) {
        const aiNode = aiTargetNodes.find(n => n.id === pos.id)
        const w = aiNode ? (aiNode.width || AI_NODE_W) : NODE_W
        const h = aiNode ? (aiNode.height || AI_NODE_H) : NODE_H
        tempLineRef.current = {
          x1: pos.x * zoom + cam.x + w * zoom / 2,
          y1: pos.y * zoom + cam.y + h * zoom / 2,
          x2: e.clientX - rect.left,
          y2: e.clientY - rect.top,
        }
        drawRef.current()
      }
    }
    const up = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect && anchorDrag) {
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const DROP_THRESHOLD = 20
        let bestTarget: { id: string; portIndex: number; dist: number } | null = null
        for (const p of positionsRef.current) {
          if (p.id === anchorDrag.fromId) continue
          const isAiTarget = aiTargetNodes.some(n => n.id === p.id)
          if (isAiTarget) {
            const aiNode = aiTargetNodes.find(n => n.id === p.id)
            const nw = aiNode?.width || AI_NODE_W
            const nh = aiNode?.height || AI_NODE_H
            const px = (p.x + nw * 0.5) * zoom + cam.x
            const py = (p.y + nh) * zoom + cam.y
            const dx = mx - px; const dy = my - py
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < DROP_THRESHOLD && (!bestTarget || dist < bestTarget.dist)) {
              bestTarget = { id: p.id, portIndex: 0, dist }
            }
          } else {
            const cx = p.x * zoom + cam.x + NODE_W * zoom / 2
            const cy = p.y * zoom + cam.y + NODE_H * zoom / 2
            const dx = mx - cx; const dy = my - cy
            if (Math.sqrt(dx * dx + dy * dy) < DROP_THRESHOLD) {
              bestTarget = { id: p.id, portIndex: -1, dist: 0 }
            }
          }
        }
        if (bestTarget) {
          const fromId = anchorDrag.fromId
          const isFromAiTarget = aiTargetNodes.some(n => n.id === fromId)
          const isCanvasTarget = bestTarget.portIndex === -1 && !isFromAiTarget
          const isCanvasToAi = bestTarget.portIndex >= 0 && !isFromAiTarget
          const isAiToCanvas = bestTarget.portIndex === -1 && isFromAiTarget
          if (connectingFromAi || isCanvasToAi || isAiToCanvas) {
            // AI connection
            const targetNode = isCanvasToAi
              ? aiTargetNodes.find(n => n.id === bestTarget.id)
              : isAiToCanvas
                ? aiTargetNodes.find(n => n.id === fromId)
                : connectingFromAi
                  ? aiTargetNodes.find(n => n.category === connectingFromAi.category)
                  : null
            const canvasElId = isCanvasToAi
              ? fromId
              : (isAiToCanvas ? bestTarget.id : (isFromAiTarget ? bestTarget.id : fromId))
            const portIndex = connectingFromAi
              ? connectingFromAi.portIndex
              : isCanvasToAi ? bestTarget.portIndex : anchorDrag.portIndex ?? 1
            if (targetNode && canvasElId !== targetNode.id) {
              const exists = aiConnections.some(c => c.aiTargetId === targetNode.id && c.canvasElementId === canvasElId)
              if (!exists) {
                addAiConnection({
                  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
                  aiTargetId: targetNode.id,
                  canvasElementId: canvasElId,
                  portIndex,
                })
                pushUndo()
              }
            }
            setConnectingFromAi(null)
          } else {
            const exists = connections.some(c => (c.fromId === fromId && c.toId === bestTarget!.id) || (c.fromId === bestTarget!.id && c.toId === fromId))
            if (!exists) {
              addConnection({
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
                fromId,
                toId: bestTarget.id,
              })
              pushUndo()
            }
          }
        }
      }
      tempLineRef.current = null
      setAnchorDrag(null)
      drawRef.current()
    }
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
  }, [anchorDrag, connectingFromAi, aiTargetNodes, aiConnections, connections, addConnection, addAiConnection, pushUndo, zoom, cam])

  useEffect(() => {
    if (!resizingAiNode) return
    const mv = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const dx = (e.clientX - resizingAiNode.startX) / zoom
      const dy = (e.clientY - resizingAiNode.startY) / zoom
      const newW = Math.max(AI_NODE_MIN_W, resizingAiNode.startW + dx)
      const newH = Math.max(AI_NODE_MIN_H, resizingAiNode.startH + dy)
      updateAiTargetNodeSize(resizingAiNode.id, newW, newH)
    }
    const up = () => {
      setResizingAiNode(null)
      pushUndo()
    }
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
  }, [resizingAiNode, zoom, updateAiTargetNodeSize, pushUndo])

  useEffect(() => {
    if (!resizingPromptNode) return
    const mv = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const dx = (e.clientX - resizingPromptNode.startX) / zoom
      const dy = (e.clientY - resizingPromptNode.startY) / zoom
      const newW = Math.max(140, resizingPromptNode.startW + dx)
      const newH = Math.max(60, resizingPromptNode.startH + dy)
      updatePromptNode(resizingPromptNode.id, { width: newW, height: newH })
    }
    const up = () => {
      setResizingPromptNode(null)
      pushUndo()
    }
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
  }, [resizingPromptNode, zoom, updatePromptNode, pushUndo])

  useEffect(() => {
    const clickClose = () => setContextMenu(null)
    window.addEventListener('click', clickClose)
    return () => window.removeEventListener('click', clickClose)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const wh = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey) {
        const rect = el.getBoundingClientRect()
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        const old = zoom
        const nz = Math.max(0.1, Math.min(5, zoom * (e.deltaY < 0 ? 1.1 : 0.9)))
        setCam({ x: mx - (mx - cam.x) * (nz / old), y: my - (my - cam.y) * (nz / old) })
        setZoom(nz)
      } else setCam(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
    }
    el.addEventListener('wheel', wh, { passive: false })
    return () => el.removeEventListener('wheel', wh)
  }, [zoom, cam])

  useEffect(() => {
    const handleF7 = (e: KeyboardEvent) => { if (e.key === 'F7') { e.preventDefault(); setTriggerGenerate(true) } }
    window.addEventListener('keydown', handleF7)
    return () => window.removeEventListener('keydown', handleF7)
  }, [setTriggerGenerate])

  useEffect(() => {
    const handleF10 = (e: KeyboardEvent) => { if (e.key === 'F10') { e.preventDefault(); setShowFullPage(p => !p) } }
    window.addEventListener('keydown', handleF10)
    return () => window.removeEventListener('keydown', handleF10)
  }, [])

  // Alt+Click to delete connections (document-level to bypass stopPropagation)
  useEffect(() => {
    const NODE_W = 160; const NODE_H = 44
    const handler = (e: MouseEvent) => {
      if (!e.altKey || e.button !== 0) return
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      // Ignore clicks outside the container
      if (mx < 0 || my < 0 || mx > rect.width || my > rect.height) return
      const z = zoomRef.current
      const c = camRef.current
      const hitDist = 15 * z
      const posMap = new Map(positionsRef.current.map(p => [p.id, p]))
      const sampleBezier = (x1: number, y1: number, x2: number, y2: number) => {
        const dx = x2 - x1; const cp = Math.abs(dx) * 0.4; const steps = 20
        for (let i = 0; i <= steps; i++) {
          const t = i / steps; const u = 1 - t
          const px = u * u * u * x1 + 3 * u * u * t * (x1 + cp) + 3 * u * t * t * (x2 - cp) + t * t * t * x2
          const py = u * u * u * y1 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y2
          if (Math.hypot(px - mx, py - my) < hitDist) return true
        }
        return false
      }
      const state = useAppStore.getState()
      // Check regular connections
      for (const conn of state.connections) {
        const a = posMap.get(conn.fromId); const b = posMap.get(conn.toId)
        if (!a || !b) continue
        const x1 = a.x * z + c.x + NODE_W * z / 2
        const y1 = a.y * z + c.y + NODE_H * z / 2
        const x2 = b.x * z + c.x + NODE_W * z / 2
        const y2 = b.y * z + c.y + NODE_H * z / 2
        if (sampleBezier(x1, y1, x2, y2)) {
          e.preventDefault()
          e.stopPropagation()
          state.removeConnection(conn.id)
          state.pushUndo()
          return
        }
      }
      // Check AI connections
      for (const conn of state.aiConnections) {
        const aiNode = posMap.get(conn.aiTargetId)
        const canvasEl = posMap.get(conn.canvasElementId)
        if (!aiNode || !canvasEl) continue
        const aiNodeFull = state.aiTargetNodes.find(n => n.id === conn.aiTargetId)
        const nw = aiNodeFull?.width || 160
        const nh = aiNodeFull?.height || 60
        const x1 = (aiNode.x + nw * 0.5) * z + c.x
        const y1 = (aiNode.y + nh) * z + c.y
        const x2 = canvasEl.x * z + c.x + NODE_W * z / 2
        const y2 = canvasEl.y * z + c.y + NODE_H * z / 2
        if (sampleBezier(x1, y1, x2, y2)) {
          e.preventDefault()
          e.stopPropagation()
          state.removeAiConnection(conn.id)
          state.pushUndo()
          return
        }
      }
      // Check Mode27 image → promptImage connections
      for (const conn of state.mode27ImageConns) {
        const imgNode = state.imageNodes.find(n => n.id === conn.imageId)
        const piNode = state.promptImageNodes.find(n => n.id === conn.promptImageId)
        if (!imgNode || !piNode) continue
        const imgPos = posMap.get(conn.imageId)
        const piPos = posMap.get(conn.promptImageId)
        if (!imgPos || !piPos) continue
        const sx = (imgPos.x + (imgNode.width || 160) * 0.5) * z + c.x
        const sy = (imgPos.y + (imgNode.height || 120)) * z + c.y
        const dx = (piPos.x + piNode.width * 0.5) * z + c.x
        const dy = piPos.y * z + c.y
        if (sampleBezier(sx, sy, dx, dy)) {
          e.preventDefault(); e.stopPropagation()
          state.removeMode27ImageConn(conn.id)
          state.pushUndo()
          return
        }
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard keyboard actions when typing in inputs/textareas
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        if (e.key !== 'Escape' && e.key !== 'Enter' && e.key !== 'F2') {
          return
        }
      }

      if (e.key === 'F2' && selectedElementId) {
        e.preventDefault()
        setRenamingNodeId(selectedElementId)
        const el = canvasElements.find(n => n.id === selectedElementId)
        setRenameValue(el?.name || '')
        return
      }
      if (e.key === 'Escape' && renamingNodeId) {
        setRenamingNodeId(null)
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault()
        pushUndo()
        if (selectedElementId.startsWith('ai-target-')) {
          removeAiTargetNode(selectedElementId)
        } else {
          removeCanvasElement(selectedElementId)
        }
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && designer27Active && selectedMode27NodeId) {
        e.preventDefault()
        pushUndo()
        const isImg = imageNodes.some(n => n.id === selectedMode27NodeId)
        const isPromptImageNode = promptImageNodes.some(n => n.id === selectedMode27NodeId)
        if (isImg) removeImageNode(selectedMode27NodeId)
        else if (isPromptImageNode) { removePromptImageNode(selectedMode27NodeId); setSelectedMode27NodeId(null) }
        else removePromptNode(selectedMode27NodeId)
        setSelectedMode27NodeId(null)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (e.key === 'Tab') {
        const el = document.activeElement
        if (el && el.closest('.generate-window')) return
        e.preventDefault()
        setCanvasMode(canvasMode === 'source' ? 'description' : 'source')
        return
      }
      if (designer27Active && (e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        const rect = containerRef.current?.getBoundingClientRect()
        const cx = rect ? (rect.width / 2 - cam.x) / zoom : 200
        const cy = rect ? (rect.height / 2 - cam.y) / zoom : 200
        const usedColors = promptNodes.map(n => n.colorTag)
        const availColors = PROMPT_COLORS.filter(c => !usedColors.includes(c))
        const color = availColors.length > 0 ? availColors[0] : PROMPT_COLORS[promptNodes.length % PROMPT_COLORS.length]
        pushUndo()
        addPromptNode({ name: 'New Prompt', x: cx - 100, y: cy - 40, width: 200, height: 80, text: '', colorTag: color })
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setQuickMode(true)
        setShowQuickConfig(true)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        setShowImportModal(true)
        return
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, removeCanvasElement, removeAiTargetNode, pushUndo, undo, redo, setCanvasMode, canvasMode, renamingNodeId, canvasElements, setQuickMode, setShowQuickConfig, setShowImportModal, designer27Active, promptNodes, addPromptNode, linkingImageId, removeImageNode, selectedMode27NodeId, imageNodes])

  const [, drop] = useDrop(() => ({
    accept: 'COMPONENT',
    drop: (item: CanvasElementType, monitor) => {
      const offset = monitor.getClientOffset()
      if (!offset || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const c = camRef.current; const z = zoomRef.current
      const x = snapToGrid((offset.x - rect.left - c.x) / z - NODE_W / 2)
      const y = snapToGrid((offset.y - rect.top - c.y) / z - NODE_H / 2)
      const newEl: CanvasElementType = {
        ...item, x: Math.max(0, x), y: Math.max(0, y),
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        width: NODE_W, height: NODE_H,
      }
      pushUndo()
      addCanvasElement(newEl)
      const currentElements = elementsRef.current
      if (currentElements.length > 0) {
        addConnection({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          fromId: currentElements[currentElements.length - 1].id,
          toId: newEl.id,
        })
      }
    },
  }), [addCanvasElement, addConnection, pushUndo])

  const downloadMode27Zip = useCallback(async () => {
    const state = useAppStore.getState()
    const iNodes = state.imageNodes
    const result = state.mode27Result
    if (!result || iNodes.length === 0) return

    const zip = new (await import('jszip')).default()
    zip.file('index.html', result)
    for (const img of iNodes) {
      if (img.base64) {
        const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, '')
        zip.file(`images/${img.name}`, base64Data, { base64: true })
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'designer27-project.zip'
    a.click()
    URL.revokeObjectURL(url)
  }, [setMode27Result])

  const setRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
    if (node) drop(node)
  }, [drop])

  const handleMode27Generate = useCallback(async () => {
    const state = useAppStore.getState()
    const pNodes = state.promptNodes
    const iNodes = state.imageNodes
    const conns = state.mode27Connections
    const pConns = state.mode27PromptConns
    if (pNodes.length === 0) return
    if (pNodes.every(p => !p.text.trim()) && iNodes.length === 0) {
      setMode27Result('Error: Add at least one image or input description before generating.')
      return
    }
    setMode27Generating(true)
    setMode27Result(null)
    abortRef.current = new AbortController()
    try {
      // Helper: parse base64 data URI into mime + raw base64
      const parseBase64 = (b64: string) => {
        const match = b64.match(/^data:(image\/\w+);base64,(.+)$/)
        if (match) return { mimeType: match[1], data: match[2] }
        return { mimeType: 'image/png', data: b64 }
      }

      // Collect all images that are linked to prompt nodes
      const allLinkedImages: { name: string; base64: string; promptName: string }[] = []
      // Collect all images (linked + unlinked)
      const linkedImgIds = new Set(conns.map(c => c.imageId))

      // Build structured prompt text
      let prompt = 'You are a web designer AI. Generate a complete HTML page based on the following instructions and visual references.\n'
      prompt += 'IMPORTANT: I am sending you actual images attached to this message. You MUST analyze their visual content (layout, colors, typography, spacing, elements) and reproduce/incorporate what you see.\n\n'

      for (const pn of pNodes) {
        const linkedImages = conns.filter(c => c.promptId === pn.id).map(c => iNodes.find(img => img.id === c.imageId)).filter(Boolean)
        // Check if this prompt has a predecessor in a chain
        const prevPrompt = pConns.find(c => c.toPromptId === pn.id)
        if (prevPrompt) {
          const prevPNode = pNodes.find(p => p.id === prevPrompt.fromPromptId)
          if (prevPNode) {
            prompt += `--- Refinement: ${prevPNode.name} ---\nThis refines the previous prompt: \"${prevPNode.text}\"\n--- End Refinement ---\n\n`
          }
        }
        if (linkedImages.length > 0) {
          prompt += `--- Instruction: ${pn.name} ---\n${pn.text || 'Reproduce the design shown in the attached images.'}\nThis instruction has ${linkedImages.length} attached image(s): ${linkedImages.map((img: any) => `"${img.name}"`).join(', ')}. You MUST look at these images and faithfully reproduce their visual design.\n--- End Instruction ---\n\n`
          linkedImages.forEach((img: any) => {
            allLinkedImages.push({ name: img.name, base64: img.base64, promptName: pn.name })
          })
        } else if (pn.name === 'image') {
          prompt += `--- Image Card ---\nHTML Structure: ${pn.text}\n--- End Image Card ---\n\n`
        } else if (pn.name === 'style') {
          prompt += `--- Style ---\nCSS/Aesthetic: ${pn.text}\n--- End Style ---\n\n`
        } else if (pn.name === 'layout') {
          prompt += `--- Layout ---\nLayout: ${pn.text}\n--- End Layout ---\n\n`
        } else {
          prompt += `--- Instruction: ${pn.name} ---\n${pn.text || 'Describe the layout, design, and elements...'}\n--- End Instruction ---\n\n`
        }
      }
      // Add unlinked images as general reference
      const unlinked = iNodes.filter(img => !linkedImgIds.has(img.id))
      if (unlinked.length > 0) {
        prompt += `--- General Style Reference (unlinked images) ---\nThe following ${unlinked.length} image(s) are attached as ambient style/palette reference. Analyze their colors, typography, and aesthetic.\n\n`
      }

      // For images used in output HTML, use these paths
      for (const img of iNodes) {
        prompt += `REQUIRED: When referencing image "${img.name}" in the output HTML, use this exact tag: <img src="./images/${img.name}" alt="${img.name}">\n`
      }
      prompt += '\nOutput ONLY raw HTML starting with <!DOCTYPE html>. CSS in <style> in <head>. Semantic markup. No markdown fences, no explanations.'

      const settings = state.apiSettings
      const { provider, baseUrl, model, apiKey } = settings
      let url = ''
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      let body: any

      // Collect all images to send (linked first, then unlinked)
      const allImagesToSend = [
        ...allLinkedImages.map(img => ({ name: img.name, base64: img.base64 })),
        ...unlinked.map(img => ({ name: img.name, base64: img.base64 })),
      ]

      if (provider === 'llama' || provider === 'ollama') {
        url = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`
      } else if (provider === 'openai') {
        url = 'https://api.openai.com/v1/chat/completions'
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      } else if (provider === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/chat/completions'
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      } else if (provider === 'gemini') {
        const cleanModel = model.replace(/^models\//, '')
        url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`
        if (apiKey) headers['x-goog-api-key'] = apiKey
      }

      if (provider === 'gemini') {
        // Gemini multi-modal: parts array with text + inline images
        const parts: any[] = [{ text: prompt }]
        for (const img of allImagesToSend) {
          const parsed = parseBase64(img.base64)
          parts.push({
            inlineData: {
              mimeType: parsed.mimeType,
              data: parsed.data,
            }
          })
        }
        body = JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 16384 },
        })
      } else {
        // OpenAI / OpenRouter / Ollama: content array with text + image_url parts
        const contentParts: any[] = [{ type: 'text', text: prompt }]
        for (const img of allImagesToSend) {
          // Ensure it's a proper data URI
          const dataUri = img.base64.startsWith('data:') ? img.base64 : `data:image/png;base64,${img.base64}`
          contentParts.push({
            type: 'image_url',
            image_url: { url: dataUri },
          })
        }
        const useContentParts = allImagesToSend.length > 0 && provider !== 'llama'
        let finalPrompt = prompt
        if (provider === 'llama' && settings.disableReasoning) {
          finalPrompt += "\n\nIMPORTANT: Skip reasoning. Do NOT output <think> tags. Respond with code immediately."
        }
        const bodyObj: any = {
          model,
          messages: [{ role: 'user', content: useContentParts ? contentParts : finalPrompt }],
          temperature: 0.3,
          max_tokens: 16384,
        }
        if (provider === 'llama' && settings.disableReasoning) {
          bodyObj.stop = ["<think>"]
        }
        body = JSON.stringify(bodyObj)
      }

      let res = await fetch(url, { method: 'POST', headers, body, signal: abortRef.current.signal })

      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      let content = ''
      if (provider === 'gemini') {
        content = data.candidates?.map((c: any) => c.content?.parts?.map((p: any) => p.text).join('')).join('') || ''
      } else {
        content = data.content || data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      }

      const tokCount = content.split(/\s+/).filter(Boolean).length
      setMode27Tokens(tokCount)
      
      // Strip markdown fences
      const htmlMatch = content.match(/```html\n([\s\S]*?)```/)
      if (htmlMatch) content = htmlMatch[1]
      const codeMatch = content.match(/```\n([\s\S]*?)```/)
      if (!htmlMatch && codeMatch) content = codeMatch[1]

      if (!content.trim()) throw new Error('Empty response')
      // Replace image paths with base64 data URIs for preview
      for (const img of iNodes) {
        const dataUri = img.base64.startsWith('data:') ? img.base64 : `data:image/png;base64,${img.base64}`
        const escapedName = img.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        content = content.replace(new RegExp(`['"]\\./images/${escapedName}['"]`, 'g'), `"${dataUri}"`)
      }
      setMode27Result(content)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setMode27Tokens(0)
      setMode27Result(`Error: ${err.message}`)
    }
    setMode27Generating(false)
    abortRef.current = null
  }, [setMode27Generating, setMode27Tokens, setMode27Result])

  const handleMode27Stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setMode27Generating(false)
  }, [setMode27Generating])

  const generatePromptImage = useCallback(async (node: PromptImageNode) => {
    const api = window.electronAPI
    if (!api?.editImage) { alert('Image generation requires Electron runtime'); return }
    const prompt = node.prompt.trim()
    if (!prompt) { alert('Please write a prompt first'); return }
    const linkedImages = mode27ImageConns.filter(c => c.promptImageId === node.id)
    const imageNodesList = imageNodes.filter(n => linkedImages.some(c => c.imageId === n.id))
    setMode27Generating(true)
    try {
      const count = Math.min(node.count, 5)
      const results = await Promise.all(
        Array.from({ length: count }, (_, i) => {
          const refImage = imageNodesList.length > 0 ? imageNodesList[0].base64 : undefined
          return api.editImage!({ prompt, imageBase64: refImage, aspectRatio: node.ratio })
        })
      )
      results.forEach((imageUrl, i) => {
        const fileName = 'gen_' + Date.now().toString(36) + '_' + i + '.png'
        let filePath: string | undefined
        const projId = designer27ProjectId.current
        api.saveDesignerImage?.(projId, fileName, imageUrl).then(p => { filePath = p }).catch(() => {})
        addImageNode({ name: fileName, base64: imageUrl, filePath, x: node.x + 220 + i * 30, y: node.y + i * 30, width: 160, height: 120 })
      })
    } catch (err: any) {
      alert('Generation failed: ' + (err.message || err))
    }
    setMode27Generating(false)
  }, [mode27ImageConns, imageNodes, addImageNode, setMode27Generating])

  const drawConnections = useCallback(() => {
    const cv = containerRef.current?.querySelector('canvas')
    if (!cv) return
    const ctx = (cv as HTMLCanvasElement).getContext('2d')
    if (!ctx) return
    const parent = containerRef.current!
    cv.width = parent.clientWidth
    cv.height = parent.clientHeight
    ctx.clearRect(0, 0, cv.width, cv.height)
    const elMap = new Map(positionsRef.current.map(p => [p.id, p]))
    const isAiTargetId = new Set(aiTargetNodes.map(n => n.id))

    // Draw regular connections
    connections.forEach(conn => {
      const a = elMap.get(conn.fromId)
      const b = elMap.get(conn.toId)
      if (!a || !b) return
      const x1 = a.x * zoom + cam.x + NODE_W * zoom / 2
      const y1 = a.y * zoom + cam.y + NODE_H * zoom / 2
      const x2 = b.x * zoom + cam.x + NODE_W * zoom / 2
      const y2 = b.y * zoom + cam.y + NODE_H * zoom / 2
      const g = ctx.createLinearGradient(x1, y1, x2, y2)
      g.addColorStop(0, '#AF40FF'); g.addColorStop(0.5, '#5B42F3'); g.addColorStop(1, '#00DDEB')
      ctx.beginPath(); ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.globalAlpha = 0.5
      const dx = x2 - x1; const cp = Math.abs(dx) * 0.4
      ctx.moveTo(x1, y1); ctx.bezierCurveTo(x1 + cp, y1, x2 - cp, y2, x2, y2)
      ctx.stroke(); ctx.globalAlpha = 1
      const angle = Math.atan2(y2 - y1, x2 - x1)
      ctx.beginPath(); ctx.fillStyle = '#00DDEB'
      const as = 8; const aa = 0.4
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - as * Math.cos(angle - aa), y2 - as * Math.sin(angle - aa))
      ctx.lineTo(x2 - as * Math.cos(angle + aa), y2 - as * Math.sin(angle + aa))
      ctx.closePath(); ctx.fill()
    })

    // Draw AI connections (dashed, green/cyan line)
    aiConnections.forEach(conn => {
      const aiNode = elMap.get(conn.aiTargetId)
      const canvasEl = elMap.get(conn.canvasElementId)
      if (!aiNode || !canvasEl) return
      const fullAiNode = aiTargetNodes.find(n => n.id === conn.aiTargetId)
      const nw = fullAiNode?.width || AI_NODE_W
      const nh = fullAiNode?.height || AI_NODE_H
      const x1 = (aiNode.x + nw * 0.5) * zoom + cam.x
      const y1 = (aiNode.y + nh) * zoom + cam.y
      const x2 = canvasEl.x * zoom + cam.x + NODE_W * zoom / 2
      const y2 = canvasEl.y * zoom + cam.y + NODE_H * zoom / 2
      ctx.beginPath(); ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6
      ctx.setLineDash([6, 4])
      const dx = x2 - x1; const cp = Math.abs(dx) * 0.4
      ctx.moveTo(x1, y1); ctx.bezierCurveTo(x1 + cp, y1, x2 - cp, y2, x2, y2)
      ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([])
      // AI badge at midpoint
      const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2
      ctx.beginPath(); ctx.fillStyle = '#4ade80'; ctx.font = '8px monospace'
      ctx.fillText('AI', mx - 6, my - 4)
    })
      // Draw Mode 27 connections (image ↔ prompt / tool ↔ prompt)
    if (designer27Active) {
      const lp = localPositionsRef.current
      mode27Connections.forEach(conn => {
        // Find source (could be ImageNode or CanvasElement)
        const srcNode = imageNodes.find(n => n.id === conn.imageId) || canvasElements.find(n => n.id === conn.imageId)
        const pn = promptNodes.find(n => n.id === conn.promptId)
        if (!srcNode || !pn) return
        
        const srcLp = lp[srcNode.id]; const pnLp = lp[pn.id]
        const srcX = srcLp?.x ?? srcNode.x; const srcY = srcLp?.y ?? srcNode.y
        const pnX = pnLp?.x ?? pn.x; const pnY = pnLp?.y ?? pn.y
        
        // Center-to-center calculation for accurate wire connections
        const x1 = srcX * zoom + cam.x + (srcNode.width / 2) * zoom
        const y1 = srcY * zoom + cam.y + (srcNode.height / 2) * zoom
        const x2 = pnX * zoom + cam.x + (pn.width / 2) * zoom
        const y2 = pnY * zoom + cam.y + (pn.height / 2) * zoom

        ctx.beginPath(); ctx.strokeStyle = pn.colorTag; ctx.lineWidth = 2; ctx.globalAlpha = 0.8
        const dx = x2 - x1; const cp = Math.abs(dx) * 0.3
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
        ctx.stroke(); ctx.globalAlpha = 1
      })
      // Prompt → prompt connections (center of one → center of another)
      mode27PromptConns.forEach(conn => {
        const lp = localPositionsRef.current
        const src = promptNodes.find(n => n.id === conn.fromPromptId)
        const dst = promptNodes.find(n => n.id === conn.toPromptId)
        if (!src || !dst) return
        const srcLp = lp[src.id]; const dstLp = lp[dst.id]
        const sx = (srcLp?.x ?? src.x) * zoom + cam.x + src.width * zoom / 2
        const sy = (srcLp?.y ?? src.y) * zoom + cam.y + src.height * zoom / 2
        const dx = (dstLp?.x ?? dst.x) * zoom + cam.x + dst.width * zoom / 2
        const dy = (dstLp?.y ?? dst.y) * zoom + cam.y + dst.height * zoom / 2
        ctx.beginPath(); ctx.strokeStyle = src.colorTag; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5
        ctx.setLineDash([3, 4])
        ctx.moveTo(sx, sy); ctx.lineTo(dx, dy)
        ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([])
      })
      // Image → PromptImage connections
      mode27ImageConns.forEach(conn => {
        const imgNode = imageNodes.find(n => n.id === conn.imageId)
        const piNode = promptImageNodes.find(n => n.id === conn.promptImageId)
        if (!imgNode || !piNode) return
        const lp = localPositionsRef.current
        const imgLp = lp[imgNode.id]; const piLp = lp[piNode.id]
        const sx = (imgLp?.x ?? imgNode.x) * zoom + cam.x + (imgNode.width || 160) * zoom / 2
        const sy = (imgLp?.y ?? imgNode.y) * zoom + cam.y + (imgNode.height || 120) * zoom
        const dx = (piLp?.x ?? piNode.x) * zoom + cam.x + piNode.width * zoom / 2
        const dy = (piLp?.y ?? piNode.y) * zoom + cam.y
        ctx.beginPath(); ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.4
        ctx.setLineDash([3, 4])
        ctx.moveTo(sx, sy); ctx.lineTo(dx, dy)
        ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([])
      })
      // Prompt → prompt connections (center of one → center of another)
      mode27PromptConnsRef.current?.forEach(conn => {
        const lp = localPositionsRef.current
        const src = promptNodes.find(n => n.id === conn.fromPromptId)
        const dst = promptNodes.find(n => n.id === conn.toPromptId)
        if (!src || !dst) return
        const srcLp = lp[src.id]; const dstLp = lp[dst.id]
        const sx = (srcLp?.x ?? src.x) * zoom + cam.x + src.width * zoom / 2
        const sy = (srcLp?.y ?? src.y) * zoom + cam.y + src.height * zoom / 2
        const dx = (dstLp?.x ?? dst.x) * zoom + cam.x + dst.width * zoom / 2
        const dy = (dstLp?.y ?? dst.y) * zoom + cam.y + dst.height * zoom / 2
        ctx.beginPath(); ctx.strokeStyle = src.colorTag; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5
        ctx.setLineDash([3, 4])
        ctx.moveTo(sx, sy); ctx.lineTo(dx, dy)
        ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([])
      })
    }

    // Draw temp anchor drag line
    const tl = tempLineRef.current
    if (tl) {
      ctx.beginPath(); ctx.strokeStyle = '#f093fb'; ctx.lineWidth = 2; ctx.globalAlpha = 0.7
      ctx.setLineDash([6, 4])
      ctx.moveTo(tl.x1, tl.y1); ctx.lineTo(tl.x2, tl.y2)
      ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([])
    }
  }, [connections, aiConnections, aiTargetNodes, cam, zoom, designer27Active, imageNodes, promptNodes, promptImageNodes, mode27Connections, mode27PromptConns, mode27ImageConns])

  mode27PromptConnsRef.current = mode27PromptConns

  const drawRef = useRef(drawConnections)
  drawRef.current = drawConnections

  useLayoutEffect(() => { drawConnections() }, [drawConnections])

  useEffect(() => {
    const parent = containerRef.current
    if (!parent) return
    const obs = new ResizeObserver(() => drawRef.current())
    obs.observe(parent)
    return () => obs.disconnect()
  }, [])

  // Tool iframe message listener
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!activeTool) return
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'tool-output') {
        const { html, css, name } = e.data
        if (!html) return
        const newEl: CanvasElementType = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          componentId: 'tool-' + activeTool,
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          width: 360,
          height: 240,
          name: name || e.data.toolName || activeTool,
          category: 'Tools',
          type: 'tool',
          html,
          css: css || '',
          description: `Generated from ${activeTool}`,
          source: 'tool',
          mode: 'source',
        }
        addCanvasElement(newEl)
        const current = useAppStore.getState().canvasElements
        const currentEls = current.filter(el => el.id !== newEl.id)
        if (currentEls.length > 0) {
          addConnection({
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            fromId: currentEls[currentEls.length - 1].id,
            toId: newEl.id,
          })
        }
        selectElement(newEl.id)
        setActiveTool(null)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [activeTool])

  return (
    <div className="flex-1 flex flex-col relative" style={{ backgroundColor: '#161616', overflow: 'hidden' }}>
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0"
        style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: '#888' }}>
            Canvas {canvasElements.length > 0 ? `\u2022 ${canvasElements.length} elements` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 mr-2" style={{ borderRight: '1px solid #333', paddingRight: 8 }}>
            {!designer27Active && (<>
            <button onClick={() => setCanvasMode('source')}
              className="px-2 py-1 rounded text-[10px] border-none cursor-pointer font-medium"
              style={{
                backgroundColor: canvasMode === 'source' ? 'linear-gradient(90deg, #667eea, #f093fb)' : 'transparent',
                color: canvasMode === 'source' ? '#fff' : '#e0e0e0',
              }}
            >&lt;/&gt; Source</button>
            <button onClick={() => setShowAiPanel(!showAiPanel)}
              className="px-2 py-1 rounded text-[10px] border-none cursor-pointer font-medium ml-1"
              style={{
                backgroundColor: showAiPanel ? 'linear-gradient(90deg, #667eea, #f093fb)' : 'transparent',
                color: showAiPanel ? '#fff' : '#e0e0e0',
              }}
            >AI</button>
            <button onClick={() => {
              setQuickMode(true)
              setShowQuickConfig(true)
            }}
              className="px-2 py-1 rounded text-[10px] border-none cursor-pointer font-medium ml-1"
              style={{
                backgroundColor: quickMode ? 'linear-gradient(90deg, #667eea, #f093fb)' : 'transparent',
                color: quickMode ? '#fff' : '#e0e0e0',
              }}
            >Quick</button>
            </>)}
            <button onClick={() => setDesigner27Active(!designer27Active)}
              className="px-2 py-1 rounded text-[10px] border-none cursor-pointer font-medium ml-1"
              style={{
                background: designer27Active ? '#2a2a2a' : 'transparent',
                color: designer27Active ? '#e0e0e0' : '#e0e0e0',
              }}
              onMouseEnter={e => { if (!designer27Active) (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a2a33' }}
              onMouseLeave={e => { if (!designer27Active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            >Designer 27</button>
            <button onClick={undo}
              className="w-6 h-6 rounded flex items-center justify-center text-[11px] border-none cursor-pointer ml-1"
              style={{ backgroundColor: 'transparent', color: '#aaa' }}
              title="Undo (Ctrl+Z)"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#333'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
              </svg>
            </button>
            <button onClick={redo}
              className="w-6 h-6 rounded flex items-center justify-center text-[11px] border-none cursor-pointer ml-0.5"
              style={{ backgroundColor: 'transparent', color: '#aaa' }}
              title="Redo (Ctrl+Y)"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#333'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
              </svg>
            </button>
            <button onClick={() => setShowSettings(true)}
              className="w-6 h-6 rounded flex items-center justify-center text-[11px] border-none cursor-pointer"
              style={{ backgroundColor: 'transparent', color: '#aaa' }}
              title="API Settings"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>
          </div>
          <button onClick={() => setZoom(z => Math.min(5, z * 1.2))}
            className="w-6 h-6 rounded flex items-center justify-center text-[11px] border-none cursor-pointer"
            style={{ backgroundColor: 'transparent', color: '#aaa' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#333'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
          >+</button>
          <span className="text-[11px] min-w-[32px] text-center" style={{ color: '#888' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.1, z / 1.2))}
            className="w-6 h-6 rounded flex items-center justify-center text-[11px] border-none cursor-pointer"
            style={{ backgroundColor: 'transparent', color: '#aaa' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#333'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
          >-</button>
          <button onClick={toggleGenerateWindow}
            className="w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer ml-1"
            style={{
              backgroundColor: showGenerateWindow ? 'transparent' : '#333',
              color: showGenerateWindow ? '#aaa' : '#666',
            }}
            title="Toggle Generate Window (Ctrl+B)"
            onMouseEnter={e => { if (showGenerateWindow) (e.currentTarget as HTMLElement).style.backgroundColor = '#333' }}
            onMouseLeave={e => { if (showGenerateWindow) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
          >
            <svg width="12" height="12" viewBox="0 0 64 64" fill="currentColor">
              <path d="M50.01,56.074l-35.989,0c-3.309,0 -5.995,-2.686 -5.995,-5.995l0,-36.011c0,-3.308 2.686,-5.994 5.995,-5.994l35.989,0c3.309,0 5.995,2.686 5.995,5.994l0,36.011c0,3.309 -2.686,5.995 -5.995,5.995Zm-25.984,-4l0,-40l-9.012,0c-1.65,0.001 -2.989,1.34 -2.989,2.989l0,34.022c0,1.649 1.339,2.989 2.989,2.989l9.012,0Zm24.991,-40l-20.991,0l0,40l20.991,0c1.65,0 2.989,-1.34 2.989,-2.989l0,-34.022c0,-1.649 -1.339,-2.988 -2.989,-2.989Z"/>
            </svg>
          </button>
          {!designer27Active && (<>
          {quickLoading && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite', marginLeft: 6 }}>
              <circle cx="12" cy="12" r="10" stroke="#333" strokeWidth="3" fill="none" />
              <circle cx="12" cy="12" r="10" stroke="#f093fb" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="62.83" strokeDashoffset="20" />
            </svg>
          )}
          <div className="text-[10px] ml-1.5 px-2 py-1 rounded" style={{ backgroundColor: '#2a2a2a', color: '#555' }}>F7</div>
          </>)}
        </div>
      </div>

      <div ref={setRef}
        className={'flex-1 relative ' + (drag?.t === 'c' ? 'cursor-grabbing' : 'cursor-grab')}
        onMouseDown={onCanvasDown}
        onContextMenu={e => {
          if (designer27Active && (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'CANVAS')) {
            e.preventDefault()
            setContextMenu({ x: e.clientX, y: e.clientY, nodeId: '__m27_bg__' })
          }
        }}
        onDragOver={e => { if (designer27Active) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' } }}
        onDrop={e => {
          if (!designer27Active) return
          e.preventDefault()
          const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
          if (files.length === 0) return
          const rect = containerRef.current!.getBoundingClientRect()
          const startX = (e.clientX - rect.left - cam.x) / zoom - 80
          const startY = (e.clientY - rect.top - cam.y) / zoom - 60
          const projId = designer27ProjectId.current
          files.forEach((file, i) => {
            const reader = new FileReader()
            reader.onload = async (ev) => {
              const b64 = ev.target?.result as string
              let filePath: string | undefined
              const api = window.electronAPI
              if (api?.saveDesignerImage) {
                filePath = await api.saveDesignerImage(projId, file.name, b64)
              }
              addImageNode({
                x: startX + i * 30, y: startY + i * 20,
                width: 160, height: 120,
                base64: b64,
                name: file.name,
                filePath,
              })
            }
            reader.readAsDataURL(file)
          })
        }}
      >
        <canvas className="absolute top-0 left-0 pointer-events-none" />

        {canvasElements.map(node => {
          const lp2 = localPositionsRef.current[node.id]
          return (
            <CanvasNode key={node.id}
              id={node.id} x={lp2?.x ?? node.x} y={lp2?.y ?? node.y}
              name={node.name} html={node.html} css={node.css || ''} js={node.js}
              category={node.category}
              zoom={zoom} cam={cam}
              isSelected={selectedElementId === node.id}
              isHovered={hoveredNodeId === node.id}
              isRenaming={renamingNodeId === node.id}
              isConnecting={connectingFromId === node.id || connectingFromAi !== null}
              isAnchorDragging={anchorDrag !== null}
              renameValue={renameValue}
              onMouseDown={onNodeDown}
              onMouseEnter={onNodeEnter}
              onMouseLeave={onNodeLeave}
              onRenameSubmit={handleRenameSubmit}
              onRenameChange={handleRenameChange}
              onContextMenu={onNodeContext}
              onAnchorMouseDown={onAnchorMouseDown}
            />
          )
        })}

        {/* Virtual AI Target Nodes */}
        {showAiPanel && aiTargetNodes.map(node => {
          const lp3 = localPositionsRef.current[node.id]
          const displayX = lp3?.x ?? node.x
          const displayY = lp3?.y ?? node.y
          const isHovered = hoveredNodeId === node.id
          const isSelected = selectedElementId === node.id
          const targetConnections = aiConnections.filter(c => c.aiTargetId === node.id)
          return (
            <div key={node.id}
              className="absolute overflow-hidden select-none"
                style={{
                  left: displayX * zoom + cam.x,
                  top: displayY * zoom + cam.y,
                  transform: 'scale(' + zoom + ')',
                  transformOrigin: 'top left',
                  width: node.width || AI_NODE_W,
                  height: node.height || AI_NODE_H,
                  background: '#121212',
                  borderRadius: 12,
                  border: isSelected ? '1.5px solid #4a4a4a' : '1px solid #2a2a2a',
                  boxShadow: isSelected ? '0 0 8px rgba(255,255,255,0.06)' : '0 2px 8px rgba(0,0,0,0.15)',
                  cursor: 'move',
                  zIndex: isSelected ? 10 : 5,
                  transition: 'border-color .2s, box-shadow .2s',
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(h => h === node.id ? null : h)}
                onMouseDown={e => onAiNodeDown(e, node.id, displayX, displayY)}
                onContextMenu={e => onNodeContext(e, node.id)}
                onDragStart={e => e.preventDefault()}
              >
                <div className="flex items-center px-3 py-2 gap-2" style={{ borderBottom: '1px solid #2a2a2a' }}>
                  <span className="flex-1 text-xs font-medium truncate" style={{ color: '#e0e0e0' }}>{node.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#2a2a2a', color: '#888' }}>{node.category}</span>
                </div>
                <div className="flex items-center justify-center" style={{ height: (node.height || AI_NODE_H) - 36 }}>
                  {[0].map(portIndex => {
                    const portConnected = targetConnections.some(c => c.portIndex === portIndex)
                    return (
                      <div key={portIndex}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          setAnchorDrag({ fromId: node.id, portIndex })
                          const rect = containerRef.current?.getBoundingClientRect()
                          if (!rect) return
                          const nw = node.width || AI_NODE_W
                          const nh = node.height || AI_NODE_H
                          const sx = (displayX + nw * 0.5) * zoom + cam.x
                          const sy = (displayY + nh) * zoom + cam.y
                          tempLineRef.current = { x1: sx, y1: sy, x2: e.clientX - rect.left, y2: e.clientY - rect.top }
                          drawRef.current()
                        }}
                        onContextMenu={(e) => {
                          if (e.altKey) {
                            e.preventDefault()
                            e.stopPropagation()
                            const conn = aiConnections.find(c => c.aiTargetId === node.id && c.portIndex === portIndex)
                            if (conn) { removeAiConnection(conn.id); pushUndo() }
                          }
                        }}
                        className="flex items-center justify-center cursor-pointer rounded-sm hover:opacity-80"
                        title={portConnected ? 'Connected' : 'Click/drag to connect'}
                        style={{ width: 12, height: 20 }}
                      >
                        <div style={{
                          width: 2,
                          height: portConnected ? 14 : 10,
                          borderRadius: 1,
                          backgroundColor: portConnected ? '#4ade80' : '#4a4a4a',
                          transition: 'all .15s',
                        }} />
                      </div>
                    )
                  })}
                </div>
                {/* resize handle */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    const startRect = containerRef.current?.getBoundingClientRect()
                    if (!startRect) return
                    setResizingAiNode({
                      id: node.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      startW: node.width || AI_NODE_W,
                      startH: node.height || AI_NODE_H,
                    })
                  }}
                  className="absolute bottom-0 right-0 cursor-nwse-resize flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                  style={{ width: 14, height: 14, zIndex: 20 }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M10 0v10H0l10-10z" fill="#4a4a4a" />
                    <path d="M10 2v8H2l8-8z" fill="#2a2a2a" />
                  </svg>
                </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeAiTargetNode(node.id) }}
                className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full border-none cursor-pointer text-[9px] opacity-0 hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(255,68,68,0.25)', color: '#ff6' }}
              >x</button>
            </div>
          )
        })}
      </div>

      {/* Mode 27: Image Nodes */}
      {designer27Active && imageNodes.map(node => {
        const lp = localPositionsRef.current[node.id]
        const displayX = lp?.x ?? node.x
        const displayY = lp?.y ?? node.y
        return (
          <div key={node.id}
            className="absolute select-none"
            style={{
              left: displayX * zoom + cam.x,
              top: displayY * zoom + cam.y,
              transform: 'scale(' + zoom + ')',
              transformOrigin: 'top left',
              width: node.width, height: node.height,
              background: '#121212',
              borderRadius: 8,
              border: selectedMode27NodeId === node.id ? '2px solid #00c8ff' : '1px solid #2a2a2a',
              boxShadow: selectedMode27NodeId === node.id ? '0 0 10px rgba(0,200,255,0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'move', zIndex: 5,
            }}
            onMouseDown={e => {
              if (!designer27Active) return
              if ((e.target as HTMLElement).closest('.m27-anchor') || (e.target as HTMLElement).closest('.m27-del-btn')) return
              const r = containerRef.current!.getBoundingClientRect()
              const ox = (e.clientX - r.left - cam.x) / zoom - displayX
              const oy = (e.clientY - r.top - cam.y) / zoom - displayY
              setDrag({ t: 'm27-img', id: node.id, ox, oy })
            }}
            onClick={e => {
              e.stopPropagation(); setSelectedMode27NodeId(node.id)
              if (linkingFromPromptForImgId) {
                const isPromptImageNode = promptImageNodes.some(n => n.id === linkingFromPromptForImgId)
                if (isPromptImageNode) {
                  const exists = mode27ImageConns.some(c => c.imageId === node.id && c.promptImageId === linkingFromPromptForImgId)
                  if (!exists) { pushUndo(); addMode27ImageConn({ imageId: node.id, promptImageId: linkingFromPromptForImgId }) }
                } else {
                  const exists = mode27Connections.some(c => c.imageId === node.id && c.promptId === linkingFromPromptForImgId)
                  if (!exists) { pushUndo(); addMode27Connection({ imageId: node.id, promptId: linkingFromPromptForImgId }) }
                }
                setLinkingFromPromptForImgId(null)
              }
            }}
            onContextMenu={e => {
              e.preventDefault()
              setContextMenu({ x: e.clientX, y: e.clientY, nodeId: 'img-' + node.id })
            }}
          >
              <div className="img-thumb" style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 7 }}>
                <img src={node.base64} alt={node.name} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Anchor port at bottom - center-to-center with prompt nodes */}
              <div className="m27-anchor" onMouseDown={e => {
                e.stopPropagation(); e.preventDefault()
                setLinkingImageId(node.id)
                const r = containerRef.current!.getBoundingClientRect()
                tempLineRef.current = {
                  x1: (displayX + node.width / 2) * zoom + cam.x,
                  y1: (displayY + node.height) * zoom + cam.y,
                  x2: e.clientX - r.left, y2: e.clientY - r.top,
                }
                drawRef.current()
              }}
                onMouseUp={e => {
                  if (linkingImageId) {
                    const exists = mode27Connections.some(c => c.imageId === linkingImageId && c.promptId === node.id)
                    if (!exists) {
                      pushUndo()
                      addMode27Connection({ imageId: linkingImageId, promptId: node.id })
                    }
                    tempLineRef.current = null; setLinkingImageId(null); drawRef.current()
                  }
                  if (linkingFromPromptForImgId) {
                    const exists = mode27Connections.some(c => c.imageId === node.id && c.promptId === linkingFromPromptForImgId)
                    if (!exists) {
                      pushUndo()
                      addMode27Connection({ imageId: node.id, promptId: linkingFromPromptForImgId })
                    }
                    tempLineRef.current = null; setLinkingFromPromptForImgId(null); drawRef.current()
                  }
                }}
                style={{
                  position: 'absolute', bottom: -8, left: '50%', marginLeft: -8,
                  width: 16, height: 16, borderRadius: '50%', cursor: 'crosshair', zIndex: 10,
                  background: mode27Connections.some(c => c.imageId === node.id) ? '#00c8ff' : '#4a4a4a',
                  border: '2px solid #121212', transition: 'background .15s',
                }}
                title="Drag to connect to a Prompt box. Alt+Right-click to remove connections."
              />
            <button onClick={(e) => { e.stopPropagation(); pushUndo(); removeImageNode(node.id) }}
              className="m27-del-btn absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full border-none cursor-pointer text-[8px] opacity-60 hover:opacity-100"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}
            >×</button>
          </div>
        )
      })}

      {/* Mode 27: Prompt Nodes */}
      {designer27Active && promptNodes.map(node => {
        const lp = localPositionsRef.current[node.id]
        const displayX = lp?.x ?? node.x
        const displayY = lp?.y ?? node.y
        const connectedImages = mode27Connections.filter(c => c.promptId === node.id)
        const connectedToThisPrompt = mode27PromptConns.filter(c => c.toPromptId === node.id)
        return (
          <div key={node.id}
            className="absolute select-none"
            style={{
              left: displayX * zoom + cam.x,
              top: displayY * zoom + cam.y,
              transform: 'scale(' + zoom + ')',
              transformOrigin: 'top left',
              width: node.width, height: node.height,
              background: '#121212',
              borderRadius: 8,
              border: selectedMode27NodeId === node.id ? '2px solid ' + node.colorTag : '1px solid ' + node.colorTag,
              boxShadow: selectedMode27NodeId === node.id ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'move', zIndex: 5,
            }}
            onMouseDown={e => {
              if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.prompt-textarea')) return
              const r = containerRef.current!.getBoundingClientRect()
              const ox = (e.clientX - r.left - cam.x) / zoom - displayX
              const oy = (e.clientY - r.top - cam.y) / zoom - displayY
              setDrag({ t: 'm27-prompt', id: node.id, ox, oy })
            }}
            onClick={e => {
              e.stopPropagation(); setSelectedMode27NodeId(node.id)
              if (linkingImageId) {
                const exists = mode27Connections.some(c => c.imageId === linkingImageId && c.promptId === node.id)
                if (!exists) {
                  pushUndo()
                  addMode27Connection({ imageId: linkingImageId, promptId: node.id })
                }
                setLinkingImageId(null)
              }
              if (linkingFromPromptId && linkingFromPromptId !== node.id) {
                const exists = mode27PromptConns.some(c => c.fromPromptId === linkingFromPromptId && c.toPromptId === node.id)
                if (!exists) {
                  pushUndo()
                  addMode27PromptConn({ fromPromptId: linkingFromPromptId, toPromptId: node.id })
                }
                setLinkingFromPromptId(null)
              }
            }}
            onDoubleClick={e => {
              e.stopPropagation()
              setExpandedPromptId(expandedPromptId === node.id ? null : node.id)
            }}
            onDragOver={e => { if (linkingImageId) { e.preventDefault() } }}
            onDrop={e => {
              e.preventDefault()
              if (linkingImageId) {
                const exists = mode27Connections.some(c => c.imageId === linkingImageId && c.promptId === node.id)
                if (!exists) {
                  pushUndo()
                  addMode27Connection({ imageId: linkingImageId, promptId: node.id })
                }
                setLinkingImageId(null)
              }
            }}
          >
            {/* Anchor port at top for receiving/initiating image connections */}
            <div onMouseDown={e => {
              e.stopPropagation(); e.preventDefault()
              setLinkingFromPromptForImgId(node.id)
              const r = containerRef.current!.getBoundingClientRect()
              tempLineRef.current = {
                x1: (displayX + node.width / 2) * zoom + cam.x,
                y1: displayY * zoom + cam.y,
                x2: e.clientX - r.left, y2: e.clientY - r.top,
              }
              drawRef.current()
            }}
              onMouseUp={e => {
                if (linkingImageId) {
                  const exists = mode27Connections.some(c => c.imageId === linkingImageId && c.promptId === node.id)
                  if (!exists) {
                    pushUndo()
                    addMode27Connection({ imageId: linkingImageId, promptId: node.id })
                  }
                  tempLineRef.current = null; setLinkingImageId(null); drawRef.current()
                }
              }}
              onContextMenu={e => {
                if (e.altKey) {
                  e.preventDefault(); e.stopPropagation()
                  const conns = mode27Connections.filter(c => c.promptId === node.id)
                  if (conns.length > 0) {
                    pushUndo()
                    conns.forEach(c => removeMode27Connection(c.id))
                  }
                }
              }}
              style={{
                position: 'absolute', top: -8, left: '50%', marginLeft: -8,
                width: 16, height: 16, borderRadius: '50%', cursor: 'crosshair', zIndex: 10,
                background: connectedImages.length > 0 ? node.colorTag : '#4a4a4a',
                border: '2px solid #121212', transition: 'background .15s',
              }}
              title="Drag to connect to an image, or drop an image connection here. Alt+Right-click to remove all connections."
            />
            <div className="flex items-center justify-between px-2 py-1" style={{ borderBottom: '1px solid ' + node.colorTag + '33', height: 24 }}>
              {renamingMode27Id === node.id ? (
                <input
                  autoFocus
                  className="flex-1 text-xs font-medium bg-transparent outline-none"
                  style={{ color: '#e0e0e0', border: 'none', borderBottom: '1px solid #666' }}
                  value={renameMode27Value}
                  onChange={e => setRenameMode27Value(e.target.value)}
                  onBlur={() => {
                    if (node.name !== renameMode27Value) {
                      pushUndo()
                      updatePromptNode(node.id, { name: renameMode27Value })
                    }
                    setRenamingMode27Id(null)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (node.name !== renameMode27Value) {
                        pushUndo()
                        updatePromptNode(node.id, { name: renameMode27Value })
                      }
                      setRenamingMode27Id(null)
                    }
                    if (e.key === 'Escape') {
                      updatePromptNode(node.id, { name: node.name })
                      setRenamingMode27Id(null)
                    }
                  }}
                />
              ) : (
                <span style={{ fontSize: 9, color: '#e0e0e0', fontWeight: 600 }}>{node.name}</span>
              )}
              <div className="flex items-center gap-1">
                <span style={{ fontSize: 8, color: '#888' }}>{connectedImages.length} img</span>
                {connectedToThisPrompt.length > 0 && (
                  <span style={{ fontSize: 7, color: node.colorTag, marginLeft: 4 }}>
                    {connectedToThisPrompt.length} chain
                  </span>
                )}
                <button onClick={(e) => { e.stopPropagation(); pushUndo(); removePromptNode(node.id) }}
                  className="w-3.5 h-3.5 flex items-center justify-center rounded-full border-none cursor-pointer text-[7px]"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#ff6' }}
                >×</button>
              </div>
            </div>
            <textarea
              className="prompt-textarea"
              value={node.text}
              onFocus={() => {
                pushUndo()
              }}
              onChange={e => updatePromptNode(node.id, { text: e.target.value })}
              placeholder="Describe what to do with linked images, or describe the layout..."
              style={{
                width: '100%', height: node.height - 24, resize: 'none', border: 'none', outline: 'none',
                background: 'transparent', color: '#e0e0e0', fontSize: 10, padding: '4px 6px',
                fontFamily: 'monospace', lineHeight: 1.4, boxSizing: 'border-box',
              }}
            />
            {/* Bottom anchor port for prompt → prompt connections */}
            <div onMouseDown={e => {
              e.stopPropagation(); e.preventDefault()
              setLinkingFromPromptId(node.id)
              const r = containerRef.current!.getBoundingClientRect()
              tempLineRef.current = {
                x1: (displayX + node.width / 2) * zoom + cam.x,
                y1: (displayY + node.height) * zoom + cam.y,
                x2: e.clientX - r.left, y2: e.clientY - r.top,
              }
              drawRef.current()
            }}
              onContextMenu={e => {
                if (e.altKey) {
                  e.preventDefault(); e.stopPropagation()
                  const conns = mode27PromptConns.filter(c => c.fromPromptId === node.id)
                  if (conns.length > 0) {
                    pushUndo()
                    conns.forEach(c => removeMode27PromptConn(c.id))
                  }
                }
              }}
              style={{
                position: 'absolute', bottom: -8, left: '50%', marginLeft: -8,
                width: 16, height: 16, borderRadius: '50%', cursor: 'crosshair', zIndex: 10,
                background: mode27PromptConns.some(c => c.fromPromptId === node.id) ? node.colorTag : '#4a4a4a',
                border: '2px solid #121212', transition: 'background .15s',
              }}
              title="Drag to connect to another Prompt box"
            />
            {/* resize handle */}
            <div
              onMouseDown={e => {
                e.stopPropagation()
                e.preventDefault()
                setResizingPromptNode({
                  id: node.id,
                  startX: e.clientX,
                  startY: e.clientY,
                  startW: node.width,
                  startH: node.height,
                })
              }}
              className="absolute bottom-0 right-0 cursor-nwse-resize flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
              style={{ width: 14, height: 14, zIndex: 20 }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M10 0v10H0l10-10z" fill="#4a4a4a" />
                <path d="M10 2v8H2l8-8z" fill="#2a2a2a" />
              </svg>
            </div>
          </div>
        )
      })}
      {expandedPromptId && (() => {
        const node = promptNodes.find(n => n.id === expandedPromptId)
        if (!node) return null
        return (
          <div className="absolute inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setExpandedPromptId(null)}
          >
            <div className="flex flex-col rounded-lg overflow-hidden" style={{ width: '600px', height: '400px', maxWidth: '90vw', background: '#1a1a1a', border: `2px solid ${node.colorTag}` }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #2a2a2a', background: '#111' }}>
                <span className="text-sm font-medium" style={{ color: '#e0e0e0' }}>{node.name}</span>
                <button onClick={() => setExpandedPromptId(null)} className="text-xs text-gray-400 hover:text-white">✕ Close</button>
              </div>
              <textarea
                className="flex-1 p-4 bg-transparent outline-none resize-none"
                style={{ color: '#e0e0e0', fontSize: 14, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', lineHeight: 1.5 }}
                value={node.text}
                onChange={e => updatePromptNode(node.id, { text: e.target.value })}
                placeholder="Describe the layout, design, and elements..."
              />
            </div>
          </div>
        )
      })()}

      {/* Mode 27: PromptImage Nodes */}
      {designer27Active && promptImageNodes.map(node => {
        const lp = localPositionsRef.current[node.id]
        const displayX = lp?.x ?? node.x
        const displayY = lp?.y ?? node.y
        const linkedImages = mode27ImageConns.filter(c => c.promptImageId === node.id)
        const ratioOptions = ['1:1', '4:3', '3:4', '16:9', '9:16']
        return (
          <div key={node.id}
            className="absolute select-none"
            style={{
              left: displayX * zoom + cam.x,
              top: displayY * zoom + cam.y,
              transform: 'scale(' + zoom + ')',
              transformOrigin: 'top left',
              width: node.width, height: node.height,
              background: '#121212',
              borderRadius: 8,
              border: selectedMode27NodeId === node.id ? '2px solid ' + node.colorTag : '1px solid ' + node.colorTag,
              boxShadow: selectedMode27NodeId === node.id ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'move', zIndex: 5,
            }}
            onMouseDown={e => {
              if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.pimg-textarea') || (e.target as HTMLElement).closest('.pimg-controls')) return
              const r = containerRef.current!.getBoundingClientRect()
              const ox = (e.clientX - r.left - cam.x) / zoom - displayX
              const oy = (e.clientY - r.top - cam.y) / zoom - displayY
              setDrag({ t: 'm27-prompt', id: node.id, ox, oy })
            }}
            onClick={e => {
              e.stopPropagation(); setSelectedMode27NodeId(node.id)
              if (linkingImageId) {
                const exists = mode27ImageConns.some(c => c.imageId === linkingImageId && c.promptImageId === node.id)
                if (!exists) {
                  pushUndo()
                  addMode27ImageConn({ imageId: linkingImageId, promptImageId: node.id })
                }
                setLinkingImageId(null)
              }
            }}
            onDragOver={e => { if (linkingImageId) e.preventDefault() }}
            onDrop={e => {
              e.preventDefault()
              if (linkingImageId) {
                const exists = mode27ImageConns.some(c => c.imageId === linkingImageId && c.promptImageId === node.id)
                if (!exists) { pushUndo(); addMode27ImageConn({ imageId: linkingImageId, promptImageId: node.id }) }
                setLinkingImageId(null)
              }
            }}
            onContextMenu={e => {
              e.preventDefault()
              setContextMenu({ x: e.clientX, y: e.clientY, nodeId: 'pi-' + node.id })
            }}
          >
            {/* Top port for linking from/to images */}
            <div onMouseDown={e => { e.stopPropagation(); e.preventDefault(); setLinkingFromPromptForImgId(node.id); const r = containerRef.current!.getBoundingClientRect(); tempLineRef.current = { x1: (displayX + node.width / 2) * zoom + cam.x, y1: displayY * zoom + cam.y, x2: e.clientX - r.left, y2: e.clientY - r.top }; drawRef.current() }}
              onMouseUp={e => {
                if (linkingImageId) {
                  const exists = mode27ImageConns.some(c => c.imageId === linkingImageId && c.promptImageId === node.id)
                  if (!exists) { pushUndo(); addMode27ImageConn({ imageId: linkingImageId, promptImageId: node.id }) }
                  tempLineRef.current = null; setLinkingImageId(null); drawRef.current()
                }
              }}
              onContextMenu={e => {
                if (e.altKey) { e.preventDefault(); e.stopPropagation(); const conns = mode27ImageConns.filter(c => c.promptImageId === node.id); if (conns.length > 0) { pushUndo(); conns.forEach(c => removeMode27ImageConn(c.id)) } }
              }}
              style={{
                position: 'absolute', top: -8, left: '50%', marginLeft: -8,
                width: 16, height: 16, borderRadius: '50%', cursor: 'crosshair', zIndex: 10,
                background: linkedImages.length > 0 ? node.colorTag : '#4a4a4a',
                border: '2px solid #121212', transition: 'background .15s',
              }}
              title="Connect to an image node"
            />
            <div className="flex items-center justify-between px-2 py-1" style={{ borderBottom: '1px solid ' + node.colorTag + '33', height: 22 }}>
              <span style={{ fontSize: 8, color: '#e0e0e0', fontWeight: 600 }}>{node.name}</span>
              <div className="flex items-center gap-1">
                <span style={{ fontSize: 7, color: '#888' }}>{linkedImages.length} img</span>
                <button onClick={(e) => { e.stopPropagation(); pushUndo(); removePromptImageNode(node.id) }}
                  className="w-3.5 h-3.5 flex items-center justify-center rounded-full border-none cursor-pointer text-[7px]"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#ff6' }}
                >×</button>
              </div>
            </div>
            <textarea
              className="pimg-textarea"
              value={node.prompt}
              onChange={e => updatePromptImageNode(node.id, { prompt: e.target.value })}
              placeholder="Describe the image to generate..."
              style={{
                width: '100%', height: node.height - 70, resize: 'none', border: 'none', outline: 'none',
                background: 'transparent', color: '#e0e0e0', fontSize: 9, padding: '3px 5px',
                fontFamily: 'monospace', lineHeight: 1.3, boxSizing: 'border-box',
              }}
            />
            <div className="pimg-controls flex items-center gap-1 px-1" style={{ height: 22, borderTop: '1px solid ' + node.colorTag + '22' }}>
              <select value={node.ratio} onChange={e => updatePromptImageNode(node.id, { ratio: e.target.value })}
                className="bg-transparent text-[8px] outline-none border-none cursor-pointer"
                style={{ color: '#888', width: 40 }}
              >
                {ratioOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="text-[7px]" style={{ color: '#555' }}>×</span>
              <select value={node.count} onChange={e => updatePromptImageNode(node.id, { count: parseInt(e.target.value) })}
                className="bg-transparent text-[8px] outline-none border-none cursor-pointer"
                style={{ color: '#888', width: 24 }}
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <div className="flex-1" />
              <button onClick={e => { e.stopPropagation(); generatePromptImage(node) }}
                className="border-none cursor-pointer rounded px-1.5 text-[7px] font-medium"
                style={{ background: node.colorTag + '44', color: '#e0e0e0' }}
              >Generate</button>
            </div>
            {/* resize handle */}
            <div
              onMouseDown={e => {
                e.stopPropagation(); e.preventDefault()
                setResizingPromptNode({ id: node.id, startX: e.clientX, startY: e.clientY, startW: node.width, startH: node.height })
              }}
              className="absolute bottom-0 right-0 cursor-nwse-resize flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
              style={{ width: 14, height: 14, zIndex: 20 }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M10 0v10H0l10-10z" fill="#4a4a4a" />
                <path d="M10 2v8H2l8-8z" fill="#2a2a2a" />
              </svg>
            </div>
          </div>
        )
      })}

      {/* Mode 27: Generate button */}
      {designer27Active && (promptNodes.length > 0 || promptImageNodes.length > 0) && (
        <div className="absolute left-1/2 -translate-x-1/2 z-50" style={{ bottom: 16 }}>
          {mode27Generating && (
            <div style={{
              height: 2, borderRadius: 2, marginBottom: 6, overflow: 'hidden',
              background: 'rgba(255,255,255,0.05)',
            }}>
              <div style={{
                height: '100%', width: '100%',
                background: 'linear-gradient(90deg, transparent, #f093fb, #f5576c, #4facfe, #f093fb, transparent)',
                backgroundSize: '200% 100%',
                animation: 'thinkingShimmer 3s linear infinite',
                maskImage: 'linear-gradient(90deg, transparent 0%, #000 20%, #000 80%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 20%, #000 80%, transparent 100%)',
              }} />
            </div>
          )}
          <button onClick={mode27Generating ? undefined : handleMode27Generate}
            style={{
              padding: '8px 24px', borderRadius: 8, border: 'none',
              background: '#2a2a2a',
              color: '#e0e0e0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {mode27Generating ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="#333" strokeWidth="3" fill="none" />
                  <circle cx="12" cy="12" r="10" stroke="#f093fb" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="62.83" strokeDashoffset="20" />
                </svg>
                Generating<span style={{ fontSize: 9, color: '#888', marginLeft: 4 }}>+{mode27Tokens} tokens{mode27Tokens === 0 && mode27Elapsed > 2 ? <span style={{ color: '#666', marginLeft: 4 }}>({mode27Elapsed}s)</span> : ''}</span>
                <button onClick={(e) => { e.stopPropagation(); handleMode27Stop() }}
                  style={{
                    background: '#c0392b', border: 'none', color: '#fff', borderRadius: 4,
                    padding: '2px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    marginLeft: 4,
                  }}
                  title="Stop generation"
                >
                  Stop
                </button>
              </>
            ) : (
              <>Generate Page<span style={{ fontSize: 9, color: '#888', marginLeft: 6 }}>+{mode27Tokens} tokens</span></>
            )}
          </button>
        </div>
      )}

      {/* Mode 27: Result overlay */}
      {mode27Result && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMode27Result(null)}
        >
          <div className="flex flex-col rounded-lg overflow-hidden" style={{ width: '80%', height: '80%', maxWidth: 900, background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
              <span style={{ color: '#e0e0e0', fontSize: 13, fontWeight: 600 }}>Generated Page</span>
              <button onClick={() => setMode27Result(null)}
                className="flex items-center justify-center rounded-full border-none cursor-pointer"
                style={{ background: 'transparent', color: '#888', width: 24, height: 24, fontSize: 12 }}
              >✕</button>
            </div>
            <div className="flex-1" style={{ background: '#fff', minHeight: 0 }}>
              <iframe srcDoc={mode27Result.startsWith('Error') ? '<div style="padding:20px;color:red;font-family:monospace">' + mode27Result + '</div>' : mode27Result}
                style={{ width: '100%', height: '100%', border: 'none' }} title="Generated Page" sandbox="allow-scripts allow-same-origin" />
            </div>
            <div className="flex items-center justify-center gap-3 px-4 py-3" style={{ borderTop: '1px solid #2a2a2a', flexShrink: 0 }}>
              <button onClick={() => {
                addCanvasElement({
                  id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
                  componentId: '', name: 'Designer27 Page ' + Date.now().toString(36),
                  x: 200 + Math.random() * 100, y: 200 + Math.random() * 100,
                  width: 220, height: 50,
                  html: mode27Result, css: '', js: '', category: 'generated', type: 'html',
                  description: 'Generated from Designer 27', source: 'designer27', mode: 'source',
                })
                pushUndo()
              }}
                className="px-3 py-1.5 rounded text-[11px] border-none cursor-pointer font-medium"
                style={{ background: '#2a2a2a', color: '#e0e0e0' }}
              >+ Canvas</button>
              <button onClick={() => {
                saveImport({ name: 'Designer27 Page ' + Date.now().toString(36), html: mode27Result, css: '', source: 'designer27' })
              }}
                className="px-3 py-1.5 rounded text-[11px] border-none cursor-pointer font-medium"
                style={{ background: '#2a2a2a', color: '#e0e0e0' }}
              >Save to Import</button>
              <button onClick={downloadMode27Zip}
                className="px-3 py-1.5 rounded text-[11px] border-none cursor-pointer font-medium"
                style={{ background: '#2a2a2a', color: '#e0e0e0' }}
              >Download ZIP</button>
              <button onClick={() => {
                const blob = new Blob([mode27Result], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = 'mode27-page.html'
                a.click()
                URL.revokeObjectURL(url)
              }}
                className="px-3 py-1.5 rounded text-[11px] border-none cursor-pointer font-medium"
                style={{ background: '#2a2a2a', color: '#e0e0e0' }}
              >Export HTML</button>
              <button onClick={() => {
                useAppStore.getState().addQuickResult({ html: mode27Result, label: 'Designer27 Page ' + Date.now().toString(36) })
                setMode27Result(null)
              }}
                className="px-3 py-1.5 rounded text-[11px] border-none cursor-pointer font-medium"
                style={{ background: '#667eea', color: '#fff' }}
              >Done — Save & Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #2a2a2a 1px, transparent 1px)',
          backgroundSize: GRID_SIZE * zoom + 'px ' + GRID_SIZE * zoom + 'px',
          backgroundPosition: cam.x % (GRID_SIZE * zoom) + 'px ' + cam.y % (GRID_SIZE * zoom) + 'px',
          opacity: 0.3,
        }}
      />

      {contextMenu && (
      <ContextMenu
        anchor={{ x: contextMenu.x, y: contextMenu.y }}
        contentKey={contextMenu.nodeId}
      >
          <div className="rounded-lg overflow-hidden shadow-xl border" style={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a', minWidth: 140 }}>
            {contextMenu.nodeId === '__m27_bg__' ? (
              <>
                <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider" style={{ color: '#555' }}>Designer 27</div>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'; input.accept = 'image/*'; input.multiple = true
                    input.onchange = () => {
                      if (!input.files) return
                      const rect = containerRef.current!.getBoundingClientRect()
                      const startX = (contextMenu.x - rect.left - cam.x) / zoom - 80
                      const startY = (contextMenu.y - rect.top - cam.y) / zoom - 60
                      const projId = designer27ProjectId.current
                      Array.from(input.files).filter(f => f.type.startsWith('image/')).forEach((file, i) => {
                        const reader = new FileReader()
                        reader.onload = async () => {
                          const b64 = reader.result as string
                          let filePath: string | undefined
                          const api = window.electronAPI
                          if (api?.saveDesignerImage) {
                            filePath = await api.saveDesignerImage(projId, file.name, b64)
                          }
                          addImageNode({ name: file.name, base64: b64, filePath, x: startX + i * 30, y: startY + i * 30, width: 160, height: 120 })
                        }
                        reader.readAsDataURL(file)
                      })
                    }
                    input.click()
                    setContextMenu(null)
                  }}
                >Import Image</button>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => {
                    const rect = containerRef.current!.getBoundingClientRect()
                    const cx = (contextMenu.x - rect.left - cam.x) / zoom - 80
                    const cy = (contextMenu.y - rect.top - cam.y) / zoom - 40
                    const usedColors = promptNodes.map(n => n.colorTag)
                    const availColors = PROMPT_COLORS.filter(c => !usedColors.includes(c))
                     addPromptNode({ name: 'New Prompt', text: '', x: cx, y: cy, width: 180, height: 100, colorTag: availColors[0] || PROMPT_COLORS[0] })
                    setContextMenu(null)
                  }}
                >Add Prompt Box</button>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => {
                    const rect = containerRef.current!.getBoundingClientRect()
                    const cx = (contextMenu.x - rect.left - cam.x) / zoom - 90
                    const cy = (contextMenu.y - rect.top - cam.y) / zoom - 60
                    const usedColors = promptImageNodes.map(n => n.colorTag)
                    const availColors = PROMPT_COLORS.filter(c => !usedColors.includes(c))
                    addPromptImageNode({ name: 'Img Prompt', prompt: '', ratio: '1:1', count: 1, x: cx, y: cy, width: 200, height: 140, colorTag: availColors[0] || PROMPT_COLORS[0] })
                    setContextMenu(null)
                  }}
                >Add Prompt Image</button>
              </>
            ) : contextMenu.nodeId.startsWith('ai-target-') ? (
              <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                style={{ color: '#e0e0e0' }}
                onClick={() => { removeAiTargetNode(contextMenu.nodeId); pushUndo(); setContextMenu(null) }}
              >Remove AI Target</button>
            ) : contextMenu.nodeId.startsWith('img-') ? (
              <>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => { const id = contextMenu.nodeId.slice(4); const imgNode = imageNodes.find(n => n.id === id); if (imgNode) setViewingNodeId('img-' + id); setContextMenu(null) }}
                >Open Image</button>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => { const id = contextMenu.nodeId.slice(4); removeImageNode(id); pushUndo(); setContextMenu(null) }}
                >Remove Image</button>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={async () => {
                    const id = contextMenu.nodeId.slice(4)
                    const imgNode = imageNodes.find(n => n.id === id)
                    if (!imgNode) { setContextMenu(null); return }
                    const api = window.electronAPI
                    if (api?.saveImageFile) {
                      await api.saveImageFile(imgNode.base64, imgNode.name)
                    } else {
                      const a = document.createElement('a')
                      a.href = imgNode.base64; a.download = imgNode.name
                      a.click()
                    }
                    setContextMenu(null)
                  }}
                >Save Image to PC</button>
              </>
            ) : contextMenu.nodeId.startsWith('pi-') ? (
              <>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => { const id = contextMenu.nodeId.slice(3); removePromptImageNode(id); pushUndo(); setContextMenu(null) }}
                >Delete Prompt Image Box</button>
              </>
            ) : (
              <>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => { removeCanvasElement(contextMenu.nodeId); pushUndo(); setContextMenu(null) }}
                >Remove Node</button>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => {
                    const src = canvasElements.find(n => n.id === contextMenu.nodeId)
                    if (src) {
                      const newEl: CanvasElementType = { ...src, id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), x: src.x + 60, y: src.y + 60 }
        addCanvasElement(newEl)
        if (designer27Active) {
          addPromptNode({
            name: newEl.name,
            x: newEl.x,
            y: newEl.y,
            width: newEl.width,
            height: newEl.height,
            text: `Component: ${newEl.name}`,
            colorTag: PROMPT_COLORS[Math.floor(Math.random() * PROMPT_COLORS.length)],
          })
        }
                      addConnection({ id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), fromId: src.id, toId: newEl.id })
                      pushUndo()
                    }
                    setContextMenu(null)
                  }}
                >Add Node After</button>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => {
                    const node = canvasElements.find(n => n.id === contextMenu.nodeId)
                    if (node) {
                      addAiMessage({ role: 'user', content: `Analyze this component:\nName: ${node.name}\nCategory: ${node.category}\n\nHTML:\n${node.html}\n\nCSS:\n${node.css || ''}` })
                      setShowAiPanel(true)
                    }
                    setContextMenu(null)
                  }}
                >Ask AI</button>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => {
                    const node = canvasElements.find(n => n.id === contextMenu.nodeId)
                    if (node) {
                      saveImport({ name: node.name, html: node.html, css: node.css || '', source: node.source || 'canvas' })
                    }
                    setContextMenu(null)
                  }}
                >Save to Imports</button>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => {
                    const node = canvasElements.find(n => n.id === contextMenu.nodeId)
                    if (node) {
                      const text = '```css\n' + (node.css || '') + '\n```\n\n```html\n' + node.html + '\n```'
                      navigator.clipboard.writeText(text)
                    }
                    setContextMenu(null)
                  }}
                >Copy Full Code</button>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => {
                    const node = canvasElements.find(n => n.id === contextMenu.nodeId)
                    if (node) { setEditCode({ html: node.html, css: node.css || '', js: node.js || '' }); setEditingNodeId(node.id) }
                    setContextMenu(null)
                  }}
                >Edit Code</button>
                <button className="w-full text-left px-3 py-2 text-xs border-none cursor-pointer hover:bg-[#2a2a2a]"
                  style={{ color: '#e0e0e0' }}
                  onClick={() => {
                    const node = canvasElements.find(n => n.id === contextMenu.nodeId)
                    if (node) { setViewingNodeId(node.id) }
                    setContextMenu(null)
                  }}
                >View Whole Page</button>
              </>
            )}
          </div>
      </ContextMenu>
      )}

      {showAiPanel && (
        <CanvasAiPanel
          connectingAiCategory={connectingFromAi}
          onAiConnectStart={(cat, portIndex) => setConnectingFromAi(cat ? {category: cat, portIndex: portIndex ?? 1} : null)}
        />
      )}

      {/* Tool viewer overlay */}
      {activeTool && (() => {
        const toolDef = TOOLS.find(t => t.name === activeTool)
        const htmlContent = toolHtmlMap[activeTool]
        const toolLabel = toolDef?.label || activeTool
        return (
          <div className="absolute inset-0 z-50 flex flex-col" style={{ backgroundColor: '#121212' }}>
            <div className="flex items-center justify-between px-4 py-2 shrink-0"
              style={{ backgroundColor: '#09090b', borderBottom: '1px solid #2a2a2a' }}>
              <span className="text-sm font-medium" style={{ color: '#e0e0e0' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="14" height="14" fill="currentColor" style={{marginRight:4}}><path d="M598.6 118.6C611.1 106.1 611.1 85.8 598.6 73.3C586.1 60.8 565.8 60.8 553.3 73.3L361.3 265.3L326.6 230.6C322.4 226.4 316.6 224 310.6 224C298.1 224 288 234.1 288 246.6L288 275.7L396.3 384L425.4 384C437.9 384 448 373.9 448 361.4C448 355.4 445.6 349.6 441.4 345.4L406.7 310.7L598.7 118.7zM373.1 417.4L254.6 298.9C211.9 295.2 169.4 310.6 138.8 341.2L130.8 349.2C108.5 371.5 96 401.7 96 433.2C96 440 103.1 444.4 109.2 441.4L160.3 415.9C165.3 413.4 169.8 420 165.7 423.8L39.3 537.4C34.7 541.6 32 547.6 32 553.9C32 566.1 41.9 576 54.1 576L227.4 576C266.2 576 303.3 560.6 330.8 533.2C361.4 502.6 376.7 460.1 373.1 417.4z"/></svg> {toolLabel}</span>
              <button onClick={() => setActiveTool(null)}
                className="px-3 py-1.5 rounded text-xs border-none cursor-pointer"
                style={{ backgroundColor: '#2a2a2a', color: '#aaa' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#333'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a2a'}
              >✕ Close</button>
            </div>
            {htmlContent ? (
              <iframe ref={iframeRef} srcDoc={htmlContent} className="flex-1 border-none w-full"
                style={{ backgroundColor: '#121212' }} />
            ) : (
              <div className="flex-1 flex items-center justify-center" style={{ color: '#6b7599', fontSize: 13 }}>
                Loading tool...
              </div>
            )}
          </div>
        )
      })()}

      {/* Full Page Preview (F10) */}
      {showFullPage && (() => {
        const combinedHtml = canvasElements.map(n => n.html).join('\n')
        const combinedCss = canvasElements.map(n => n.css || '').join('\n')
        const combinedJs = canvasElements.map(n => n.js || '').join('\n')
        const fullDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#121212;color:#e0e0e0;min-height:100vh}${combinedCss}</style></head><body>${combinedHtml}<script>${combinedJs}<\/script></body></html>`
        return (
          <div className="absolute inset-0 z-50 flex flex-col" style={{ backgroundColor: '#09090b' }}>
            <div className="flex items-center justify-between px-4 py-2 shrink-0"
              style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
              <span className="text-xs font-medium" style={{ color: '#e0e0e0' }}>Full Page Preview ({canvasElements.length} elements)</span>
              <button onClick={() => setShowFullPage(false)}
                className="px-3 py-1.5 rounded text-xs border-none cursor-pointer"
                style={{ backgroundColor: '#2a2a2a', color: '#aaa' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#333'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a2a'}
              >✕ Close</button>
            </div>
            <iframe srcDoc={fullDoc} className="flex-1 border-none w-full" style={{ backgroundColor: '#121212' }} />
          </div>
        )
      })()}

      {/* View Whole Page overlay */}
      {viewingNodeId && (() => {
        if (viewingNodeId.startsWith('img-')) {
          const imgNode = imageNodes.find(n => n.id === viewingNodeId.slice(4))
          if (!imgNode) return null
          return (
            <div className="absolute inset-0 z-50 flex flex-col" style={{ backgroundColor: '#121212' }}>
              <div className="flex items-center justify-between px-4 py-2 shrink-0"
                style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
                <span className="text-xs font-medium" style={{ color: '#e0e0e0' }}>Image: {imgNode.name}</span>
                <button onClick={() => setViewingNodeId(null)}
                  className="px-3 py-1.5 rounded text-xs border-none cursor-pointer"
                  style={{ backgroundColor: '#2a2a2a', color: '#aaa' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#333'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a2a'}
                >✕ Close</button>
              </div>
              <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                <img src={imgNode.base64} alt={imgNode.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
              </div>
            </div>
          )
        }
        const node = canvasElements.find(n => n.id === viewingNodeId)
        if (!node) return null
        const fullDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${node.css || ''}*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#121212;color:#e0e0e0;padding:20px;min-height:100vh}</style></head><body>${node.html}</body></html>`
        return (
          <div className="absolute inset-0 z-50 flex flex-col" style={{ backgroundColor: '#121212' }}>
            <div className="flex items-center justify-between px-4 py-2 shrink-0"
              style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
              <span className="text-xs font-medium" style={{ color: '#e0e0e0' }}>Preview: {node.name}</span>
              <button onClick={() => setViewingNodeId(null)}
                className="px-3 py-1.5 rounded text-xs border-none cursor-pointer"
                style={{ backgroundColor: '#2a2a2a', color: '#aaa' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#333'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a2a'}
              >✕ Close</button>
            </div>
            <iframe srcDoc={fullDoc} className="flex-1 border-none w-full" style={{ backgroundColor: '#121212' }} />
          </div>
        )
      })()}

      {/* Edit Code overlay */}
      {editingNodeId && (() => {
        const node = canvasElements.find(n => n.id === editingNodeId)
        if (!node) return null
        return (
          <div className="absolute inset-0 z-50 flex flex-col" style={{ backgroundColor: '#09090b' }}>
            <div className="flex items-center justify-between px-4 py-2 shrink-0"
              style={{ backgroundColor: '#09090b', borderBottom: '1px solid #2a2a2a' }}>
              <span className="text-xs font-medium" style={{ color: '#e0e0e0' }}>Edit Code: {node.name}</span>
              <div className="flex gap-2">
                <button onClick={() => {
                  updateCanvasElement(editingNodeId, { html: editCode.html, css: editCode.css, js: editCode.js || undefined })
                  pushUndo()
                  setEditingNodeId(null)
                }}
                  className="px-3 py-1.5 rounded text-xs border-none cursor-pointer"
                  style={{ backgroundColor: '#4ade80', color: '#000' }}
                >Save</button>
                <button onClick={() => setEditingNodeId(null)}
                  className="px-3 py-1.5 rounded text-xs border-none cursor-pointer"
                  style={{ backgroundColor: '#2a2a2a', color: '#aaa' }}
                >✕</button>
              </div>
            </div>
            <div className="flex-1 flex" style={{ minHeight: 0 }}>
              <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid #2a2a2a' }}>
                <div className="text-[10px] px-3 py-1" style={{ color: '#555', background: '#111', borderBottom: '1px solid #2a2a2a' }}>HTML</div>
                <textarea className="flex-1 w-full border-none outline-none resize-none p-3 text-xs font-mono"
                  style={{ background: '#09090b', color: '#e0e0e0' }}
                  value={editCode.html} onChange={e => setEditCode(p => ({ ...p, html: e.target.value }))} spellCheck={false} />
              </div>
              <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid #2a2a2a' }}>
                <div className="text-[10px] px-3 py-1" style={{ color: '#555', background: '#09090b', borderBottom: '1px solid #2a2a2a' }}>CSS</div>
                <textarea className="flex-1 w-full border-none outline-none resize-none p-3 text-xs font-mono"
                  style={{ background: '#09090b', color: '#e0e0e0' }}
                  value={editCode.css} onChange={e => setEditCode(p => ({ ...p, css: e.target.value }))} spellCheck={false} />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="text-[10px] px-3 py-1" style={{ color: '#555', background: '#09090b', borderBottom: '1px solid #2a2a2a' }}>JS (React JSX)</div>
                <textarea className="flex-1 w-full border-none outline-none resize-none p-3 text-xs font-mono"
                  style={{ background: '#09090b', color: '#e0e0e0' }}
                  value={editCode.js} onChange={e => setEditCode(p => ({ ...p, js: e.target.value }))} spellCheck={false} />
              </div>
            </div>
          </div>
        )
      })()}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showQuickConfig && (
        <QuickConfigurator
          onClose={() => setShowQuickConfig(false)}
          onGenerate={(prompt, cat) => {
            setShowQuickConfig(false)
            setShowAiPanel(true)
            setQuickLoading(true)
            setQuickGenerate({ prompt, category: cat })
          }}
        />
      )}
    </div>
  )
}

export default Canvas
