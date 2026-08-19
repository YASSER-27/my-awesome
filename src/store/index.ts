import { create } from 'zustand'
import { CanvasElement, Connection, AiTargetNode, AiConnection, AiMessage, Category, ComponentItem, SavedImport, ApiSettings, ApiProvider, ImageNode, PromptNode, Mode27Connection, Mode27PromptConnection, PromptImageNode, Mode27ImageConnection, PROMPT_COLORS } from '../types'

const STORAGE_KEY = 'my-awesome-imports'
const API_SETTINGS_KEY = 'my-awesome-api-settings'
const QUICK_RESULTS_KEY = 'my-awesome-quick-results'
const FAVORITES_KEY = 'my-awesome-favorites'

const DEFAULT_API_SETTINGS: ApiSettings = {
  provider: 'llama',
  baseUrl: 'http://localhost:8080',
  model: 'deepseek',
  apiKey: '',
  connected: false,
  disableReasoning: false,
  gameSystemPrompt: '',
}

function loadSavedImports(): SavedImport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveSavedImports(imports: SavedImport[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(imports)) } catch {}
}

function loadApiSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(API_SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_API_SETTINGS, ...parsed }
    }
  } catch {}
  return DEFAULT_API_SETTINGS
}

function saveApiSettings(settings: ApiSettings) {
  try { localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(settings)) } catch {}
}

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveFavorites(ids: string[]) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids)) } catch {}
}

function loadQuickResults(): { id: string; html: string; category?: string; createdAt: number; label: string }[] {
  try {
    const raw = localStorage.getItem(QUICK_RESULTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveQuickResults(results: { id: string; html: string; category?: string; createdAt: number; label: string }[]) {
  try { localStorage.setItem(QUICK_RESULTS_KEY, JSON.stringify(results)) } catch {}
}

export const PROVIDER_CONFIGS: Record<ApiProvider, { label: string; defaultUrl: string; defaultModel: string }> = {
  llama: { label: 'llama.cpp', defaultUrl: 'http://localhost:8080', defaultModel: 'deepseek' },
  ollama: { label: 'Ollama', defaultUrl: 'http://127.0.0.1:11434', defaultModel: 'llama3.2' },
  gemini: { label: 'Gemini', defaultUrl: '', defaultModel: 'gemini-2.0-flash-exp' },
  openai: { label: 'OpenAI', defaultUrl: '', defaultModel: 'gpt-4o-mini' },
  openrouter: { label: 'OpenRouter', defaultUrl: '', defaultModel: 'deepseek/deepseek-chat' },
}

const CATEGORY_LABELS: Record<string, string> = {
  backgrounds: 'Backgrounds', buttons: 'Buttons', cards: 'Cards',
  bars: 'Bars', navigation: 'Navigation', inputs: 'Inputs',
  feedback: 'Feedback', status: 'Status', tabs: 'Tabs',
  grids: 'Grids', glass: 'Glass', colors: 'Color Palettes',
  dashboard: 'Dashboard', data: 'Data', code: 'Code',
  media: 'Media', layout: 'Layout', switches: 'Switches',
  skeletons: 'Skeletons', typography: 'Typography',
  new: 'New',
}

const CATEGORY_ICONS: Record<string, string> = {
  Backgrounds: '[Bg]', Buttons: '[Btn]', Cards: '[Card]',
  Bars: '[Bar]', Navigation: '[Nav]', Inputs: '[Inp]',
  Feedback: '[Fb]', Status: '[St]', Tabs: '[Tab]',
  Grids: '[Grid]', Glass: '[Glass]', 'Color Palettes': '[Pal]',
  Dashboard: '[Db]', Data: '[Data]', Code: '[Code]',
  Media: '[Media]', Layout: '[Lay]', Switches: '[Sw]',
  Skeletons: '[Sk]', Typography: '[Typo]',
}

const GRID_SIZE = 20
let cachedCategories: Category[] | null = null

async function loadData(): Promise<Category[]> {
  if (cachedCategories) return cachedCategories

  const module: any = await import('../data/components.json')
  const raw = module.default || module
  const cats: Category[] = []

  for (const [key, catData] of Object.entries(raw.categories || raw)) {
    const label = CATEGORY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1)
    const items = (catData as any).items || (catData as any[]) || []
    const comps: ComponentItem[] = (items as any[]).map((p: any, i: number) => ({
      id: `${key}-${i}`,
      name: p.componentName || `${key}-${i + 1}`,
      category: label,
      type: p.type || key,
      html: p.html || '',
      css: p.css || '',
      description: p.description || `A ${key.slice(0, -1)} component`,
      source: p.source || key,
    }))
    cats.push({ name: label, expanded: false, components: comps })
  }

  // Dynamically load New/ folder via Electron IPC (no rebuild needed when adding files)
  if (window.electronAPI) {
    try {
      const newDirPath = await window.electronAPI.getNewComponentsPath()
      const files = await window.electronAPI.readDir(newDirPath)
      const htmlFiles = files.filter(f => f.endsWith('.html')).sort()
      const newComps: ComponentItem[] = []
      for (let i = 0; i < htmlFiles.length; i++) {
        const content = await window.electronAPI.readFile(newDirPath + '\\' + htmlFiles[i])
        const cssMatch = content.match(/^<style>([\s\S]*?)<\/style>\s*([\s\S]*)$/i)
        const css = cssMatch ? cssMatch[1].trim() : ''
        const html = cssMatch ? cssMatch[2].trim() : content.trim()
        const name = htmlFiles[i].replace(/\.html$/i, '').replace(/^\d+-/, '').replace(/[-_]/g, ' ')
        newComps.push({
          id: `new-${i}`,
          name,
          category: 'New',
          type: 'new',
          html,
          css,
          description: `A New component from ${htmlFiles[i]}`,
          source: 'new',
        })
      }
      if (newComps.length > 0) {
        cats.push({ name: 'New', expanded: false, components: newComps })
      }
    } catch (e) {
      console.warn('Failed to load New components dynamically:', e)
    }
  }

  cachedCategories = cats
  return cats
}

const snapToGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE

function findConnectedGraph(elements: CanvasElement[], connections: Connection[], startId?: string | null): CanvasElement[] {
  if (elements.length === 0) return []

  if (!startId || !elements.find(e => e.id === startId)) {
    const connectedIds = new Set<string>()
    const adj = new Map<string, Set<string>>()
    for (const el of elements) adj.set(el.id, new Set())
    for (const conn of connections) {
      adj.get(conn.fromId)?.add(conn.toId)
      adj.get(conn.toId)?.add(conn.fromId)
    }
    const visited = new Set<string>()
    for (const el of elements) {
      if (!visited.has(el.id)) {
        const stack = [el.id]
        while (stack.length) {
          const id = stack.pop()!
          if (visited.has(id)) continue
          visited.add(id)
          for (const n of adj.get(id) || []) stack.push(n)
        }
      }
    }
    return elements.filter(e => visited.has(e.id))
  }

  const adj = new Map<string, Set<string>>()
  for (const el of elements) adj.set(el.id, new Set())
  for (const conn of connections) {
    adj.get(conn.fromId)?.add(conn.toId)
    adj.get(conn.toId)?.add(conn.fromId)
  }

  const connected = new Set<string>()
  const queue = [startId]
  while (queue.length) {
    const id = queue.shift()!
    if (connected.has(id)) continue
    connected.add(id)
    for (const n of adj.get(id) || []) queue.push(n)
  }

  return elements.filter(e => connected.has(e.id))
}

export interface ToolDefinition {
  name: string
  label: string
  file: string
}

export const TOOLS: ToolDefinition[] = [
  { name: 'color-palette', label: 'Color Palette', file: 'color-palette.html' },
  { name: 'text-gradient', label: 'Text Gradient', file: 'text-gradient-generator.html' },
  { name: 'mesh-gradient', label: 'Mesh Gradient', file: 'mesh-gradient-generator.html' },
  { name: 'ui-studio', label: 'UI Component Studio', file: 'awsome_desinger.html' },
  { name: 'ui-library', label: 'UI Library', file: 'UI Library.html' },
  { name: 'vfx-studio', label: 'VFX Studio', file: 'VFX Studio.html' },
  { name: 'color-combination', label: 'Color Combination', file: 'color-combination.html' },
  { name: 'vfx-effects-library', label: 'VFX Effects Library', file: 'vfx_effects_library.html' },
  { name: 'pyside6-styles', label: 'PySide6 Styles', file: 'pyside6_styles.html' },
  { name: 'keyfram-v1', label: 'KeyFram@ v1', file: 'KeyFram@ v1.html' },
  { name: 'keyfram-v2', label: 'KeyFram@ v2', file: 'KeyFram@ v2.html' },
  { name: 'template-v1', label: 'Template V1', file: 'template V1.html' },
  { name: 'template-v2', label: 'Template V2', file: 'template V2.html' },
]

interface Snapshot {
  elements: CanvasElement[]
  connections: Connection[]
  aiTargetNodes: AiTargetNode[]
  aiConnections: AiConnection[]
  imageNodes?: ImageNode[]
  promptNodes?: PromptNode[]
  promptImageNodes?: PromptImageNode[]
  mode27Connections?: Mode27Connection[]
  mode27PromptConns?: Mode27PromptConnection[]
  mode27ImageConns?: Mode27ImageConnection[]
}

interface AppState {
  categories: Category[]
  canvasElements: CanvasElement[]
  connections: Connection[]
  aiTargetNodes: AiTargetNode[]
  aiConnections: AiConnection[]
  selectedElementId: string | null
  canvasMode: 'source' | 'description'
  quickMode: boolean
  designer27Active: boolean
  setDesigner27Active: (v: boolean) => void
  selectedMode27NodeId: string | null
  setSelectedMode27NodeId: (id: string | null) => void
  imageNodes: ImageNode[]
  addImageNode: (node: Omit<ImageNode, 'id'>) => void
  removeImageNode: (id: string) => void
  updateImageNodePosition: (id: string, x: number, y: number) => void
  updateImageNode: (id: string, updates: Partial<ImageNode>) => void
  promptNodes: PromptNode[]
  addPromptNode: (node: Omit<PromptNode, 'id'>) => void
  removePromptNode: (id: string) => void
  updatePromptNodePosition: (id: string, x: number, y: number) => void
  updatePromptNode: (id: string, updates: Partial<PromptNode>) => void
  promptImageNodes: PromptImageNode[]
  addPromptImageNode: (node: Omit<PromptImageNode, 'id'>) => void
  removePromptImageNode: (id: string) => void
  updatePromptImageNodePosition: (id: string, x: number, y: number) => void
  updatePromptImageNode: (id: string, updates: Partial<PromptImageNode>) => void
  mode27ImageConns: Mode27ImageConnection[]
  addMode27ImageConn: (conn: Omit<Mode27ImageConnection, 'id'>) => void
  removeMode27ImageConn: (id: string) => void
  mode27Connections: Mode27Connection[]
  addMode27Connection: (conn: Omit<Mode27Connection, 'id'>) => void
  removeMode27Connection: (id: string) => void
  mode27PromptConns: Mode27PromptConnection[]
  addMode27PromptConn: (conn: Omit<Mode27PromptConnection, 'id'>) => void
  removeMode27PromptConn: (id: string) => void
  mode27Generating: boolean
  setMode27Generating: (v: boolean) => void
  mode27Tokens: number
  setMode27Tokens: (v: number) => void
  mode27Result: string | null
  setMode27Result: (v: string | null) => void
  isLoading: boolean
  activeTool: string | null
  undoStack: Snapshot[]
  redoStack: Snapshot[]
  savedImports: SavedImport[]
  saveImport: (imp: { name: string; html: string; css: string; js?: string; source: string }) => void
  deleteSavedImport: (id: string) => void
  renameSavedImport: (id: string, name: string) => void
  setCategories: (categories: Category[]) => void
  addCanvasElement: (element: CanvasElement) => void
  updateCanvasElement: (id: string, updates: Partial<CanvasElement>) => void
  removeCanvasElement: (id: string) => void
  selectElement: (id: string | null) => void
  setCanvasMode: (mode: 'source' | 'description') => void
  setQuickMode: (v: boolean) => void
  triggerGenerate: boolean
  setTriggerGenerate: (v: boolean) => void
  addConnection: (connection: Connection) => void
  removeConnection: (id: string) => void
  updateElementPosition: (id: string, x: number, y: number) => void
  setActiveTool: (tool: string | null) => void
  pushUndo: () => void
  undo: () => void
  redo: () => void
  addAiTargetNode: (node: AiTargetNode) => void
  removeAiTargetNode: (id: string) => void
  updateAiTargetNodePosition: (id: string, x: number, y: number) => void
  updateAiTargetNodeSize: (id: string, width: number, height: number) => void
  addAiConnection: (conn: AiConnection) => void
  removeAiConnection: (id: string) => void
  aiMessages: AiMessage[]
  addAiMessage: (msg: Omit<AiMessage, 'id' | 'createdAt'>) => string
  quickGenerate: { prompt: string; category?: string } | null
  setQuickGenerate: (v: { prompt: string; category?: string } | null) => void
  quickLoading: boolean
  setQuickLoading: (v: boolean) => void
  quickResults: { id: string; html: string; category?: string; createdAt: number; label: string }[]
  addQuickResult: (r: { html: string; category?: string; label: string }) => void
  removeQuickResult: (id: string) => void
  showImportModal: boolean
  setShowImportModal: (v: boolean) => void
  updateAiMessageContent: (id: string, content: string) => void
  updateAiMessageReasoning: (id: string, reasoning: string) => void
  clearAiMessages: () => void
  apiSettings: ApiSettings
  setApiProvider: (p: ApiProvider) => void
  setApiBaseUrl: (url: string) => void
  setApiModel: (model: string) => void
  setApiKey: (key: string) => void
  setApiConnected: (v: boolean) => void
  setApiDisableReasoning: (v: boolean) => void
  setApiGamePrompt: (v: string) => void

  favoriteIds: string[]
  toggleFavorite: (id: string) => void

  showGenerateWindow: boolean
  toggleGenerateWindow: () => void
  setShowGenerateWindow: (v: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  categories: [],
  canvasElements: [],
  connections: [],
  aiTargetNodes: [],
  aiConnections: [],
  aiMessages: [],
  selectedElementId: null,
  canvasMode: 'source',
  quickMode: false,
  designer27Active: false,
  selectedMode27NodeId: null,
  imageNodes: [],
  promptNodes: [],
  promptImageNodes: [],
  mode27ImageConns: [],
  mode27Connections: [],
  mode27PromptConns: [],
  mode27Generating: false,
  mode27Tokens: 0,
  mode27Result: null,
  quickGenerate: null,
  quickLoading: false,
  showImportModal: false,
  quickResults: loadQuickResults(),
  isLoading: true,
  activeTool: null,
  undoStack: [],
  redoStack: [],
  savedImports: loadSavedImports(),
  apiSettings: loadApiSettings(),
  showGenerateWindow: true,

  toggleGenerateWindow: () => set((state) => ({ showGenerateWindow: !state.showGenerateWindow })),
  setShowGenerateWindow: (v) => set({ showGenerateWindow: v }),

  favoriteIds: loadFavorites(),

  toggleFavorite: (id) => set((state) => {
    const has = state.favoriteIds.includes(id)
    const updated = has ? state.favoriteIds.filter(fid => fid !== id) : [...state.favoriteIds, id]
    saveFavorites(updated)
    return { favoriteIds: updated }
  }),

  saveImport: (imp) => set((state) => {
    const updated = [...state.savedImports, {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
      ...imp,
      createdAt: Date.now(),
    }]
    saveSavedImports(updated)
    return { savedImports: updated }
  }),

  deleteSavedImport: (id) => set((state) => {
    const updated = state.savedImports.filter(i => i.id !== id)
    saveSavedImports(updated)
    return { savedImports: updated }
  }),
  renameSavedImport: (id, name) => set((state) => {
    const updated = state.savedImports.map(i => i.id === id ? { ...i, name } : i)
    saveSavedImports(updated)
    return { savedImports: updated }
  }),

  setCategories: (categories) => set({ categories, isLoading: false }),

  pushUndo: () => set((state) => ({
    undoStack: [...state.undoStack.slice(-49), {
      elements: state.canvasElements.slice(),
      connections: state.connections.slice(),
      aiTargetNodes: state.aiTargetNodes.slice(),
      aiConnections: state.aiConnections.slice(),
      imageNodes: state.imageNodes.slice(),
      promptNodes: state.promptNodes.slice(),
      promptImageNodes: state.promptImageNodes.slice(),
      mode27Connections: state.mode27Connections.slice(),
      mode27PromptConns: state.mode27PromptConns.slice(),
      mode27ImageConns: state.mode27ImageConns.slice(),
    }],
    redoStack: [],
  })),

  undo: () => {
    const state = get()
    if (state.undoStack.length === 0) return
    const prev = state.undoStack[state.undoStack.length - 1]
    set({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, {
        elements: state.canvasElements.slice(),
        connections: state.connections.slice(),
        aiTargetNodes: state.aiTargetNodes.slice(),
        aiConnections: state.aiConnections.slice(),
        imageNodes: state.imageNodes.slice(),
        promptNodes: state.promptNodes.slice(),
        promptImageNodes: state.promptImageNodes.slice(),
        mode27Connections: state.mode27Connections.slice(),
        mode27PromptConns: state.mode27PromptConns.slice(),
        mode27ImageConns: state.mode27ImageConns.slice(),
      }],
      canvasElements: prev.elements,
      connections: prev.connections,
      aiTargetNodes: prev.aiTargetNodes,
      aiConnections: prev.aiConnections,
      imageNodes: prev.imageNodes || [],
      promptNodes: prev.promptNodes || [],
      promptImageNodes: prev.promptImageNodes || [],
      mode27Connections: prev.mode27Connections || [],
      mode27PromptConns: prev.mode27PromptConns || [],
      mode27ImageConns: prev.mode27ImageConns || [],
    })
  },

  redo: () => {
    const state = get()
    if (state.redoStack.length === 0) return
    const next = state.redoStack[state.redoStack.length - 1]
    set({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, {
        elements: state.canvasElements.slice(),
        connections: state.connections.slice(),
        aiTargetNodes: state.aiTargetNodes.slice(),
        aiConnections: state.aiConnections.slice(),
        imageNodes: state.imageNodes.slice(),
        promptNodes: state.promptNodes.slice(),
        promptImageNodes: state.promptImageNodes.slice(),
        mode27Connections: state.mode27Connections.slice(),
        mode27PromptConns: state.mode27PromptConns.slice(),
        mode27ImageConns: state.mode27ImageConns.slice(),
      }],
      canvasElements: next.elements,
      connections: next.connections,
      aiTargetNodes: next.aiTargetNodes,
      aiConnections: next.aiConnections,
      imageNodes: next.imageNodes || [],
      promptNodes: next.promptNodes || [],
      promptImageNodes: next.promptImageNodes || [],
      mode27Connections: next.mode27Connections || [],
      mode27PromptConns: next.mode27PromptConns || [],
      mode27ImageConns: next.mode27ImageConns || [],
    })
  },

  addCanvasElement: (element) => set((state) => ({
    canvasElements: [...state.canvasElements, element],
  })),

  updateCanvasElement: (id, updates) => set((state) => ({
    canvasElements: state.canvasElements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    ),
  })),

  removeCanvasElement: (id) => set((state) => ({
    canvasElements: state.canvasElements.filter((el) => el.id !== id),
    connections: state.connections.filter((c) => c.fromId !== id && c.toId !== id),
    aiConnections: state.aiConnections.filter((c) => c.canvasElementId !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
  })),

  selectElement: (id) => set({ selectedElementId: id }),

  setCanvasMode: (mode) => set({ canvasMode: mode }),
  setQuickMode: (v) => set({ quickMode: v }),
  triggerGenerate: false,
  setTriggerGenerate: (v) => set({ triggerGenerate: v }),

  addConnection: (connection) => set((state) => ({
    connections: [...state.connections, connection],
  })),
  removeConnection: (id) => set((state) => ({
    connections: state.connections.filter((c) => c.id !== id),
  })),

  updateElementPosition: (id, x, y) => set((state) => ({
    canvasElements: state.canvasElements.map((el) =>
      el.id === id ? { ...el, x: snapToGrid(x), y: snapToGrid(y) } : el
    ),
  })),

  setActiveTool: (tool) => set({ activeTool: tool }),

  addAiTargetNode: (node) => set((state) => ({
    aiTargetNodes: [...state.aiTargetNodes, node],
  })),

  removeAiTargetNode: (id) => set((state) => ({
    aiTargetNodes: state.aiTargetNodes.filter((n) => n.id !== id),
    aiConnections: state.aiConnections.filter((c) => c.aiTargetId !== id),
  })),

  updateAiTargetNodePosition: (id, x, y) => set((state) => ({
    aiTargetNodes: state.aiTargetNodes.map((n) =>
      n.id === id ? { ...n, x: snapToGrid(x), y: snapToGrid(y) } : n
    ),
  })),
  updateAiTargetNodeSize: (id, width, height) => set((state) => ({
    aiTargetNodes: state.aiTargetNodes.map((n) =>
      n.id === id ? { ...n, width: Math.max(100, width), height: Math.max(40, height) } : n
    ),
  })),

  addAiConnection: (conn) => set((state) => ({
    aiConnections: [...state.aiConnections, conn],
  })),

  removeAiConnection: (id) => set((state) => ({
    aiConnections: state.aiConnections.filter((c) => c.id !== id),
  })),

  addAiMessage: (msg) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)
    set((state) => {
      const MAX_MSGS = 40
      const next = [...state.aiMessages, { ...msg, id, createdAt: Date.now() }]
      return { aiMessages: next.length > MAX_MSGS ? next.slice(next.length - MAX_MSGS) : next }
    })
    return id
  },

  updateAiMessageContent: (id, content) => set((state) => ({
    aiMessages: state.aiMessages.map(m => m.id === id ? { ...m, content } : m),
  })),

  updateAiMessageReasoning: (id, reasoning) => set((state) => ({
    aiMessages: state.aiMessages.map(m => m.id === id ? { ...m, reasoning } : m),
  })),

  clearAiMessages: () => set({ aiMessages: [] }),

  setApiProvider: (p) => set((state) => {
    const cfg = PROVIDER_CONFIGS[p]
    const updated: ApiSettings = { ...state.apiSettings, provider: p, baseUrl: cfg.defaultUrl, model: cfg.defaultModel }
    saveApiSettings(updated)
    return { apiSettings: updated }
  }),

  setApiBaseUrl: (url) => set((state) => {
    const updated = { ...state.apiSettings, baseUrl: url }
    saveApiSettings(updated)
    return { apiSettings: updated }
  }),

  setApiModel: (model) => set((state) => {
    const updated = { ...state.apiSettings, model }
    saveApiSettings(updated)
    return { apiSettings: updated }
  }),

  setApiKey: (key) => set((state) => {
    const updated = { ...state.apiSettings, apiKey: key }
    saveApiSettings(updated)
    return { apiSettings: updated }
  }),

  setApiConnected: (v) => set((state) => {
    const updated = { ...state.apiSettings, connected: v }
    saveApiSettings(updated)
    return { apiSettings: updated }
  }),

  setApiDisableReasoning: (v) => set((state) => {
    const updated = { ...state.apiSettings, disableReasoning: v }
    saveApiSettings(updated)
    return { apiSettings: updated }
  }),

  setApiGamePrompt: (v) => set((state) => {
    const updated = { ...state.apiSettings, gameSystemPrompt: v }
    saveApiSettings(updated)
    return { apiSettings: updated }
  }),

  setDesigner27Active: (v) => set({ designer27Active: v }),
  setSelectedMode27NodeId: (id) => set({ selectedMode27NodeId: id }),

  addImageNode: (node) => set((state) => ({
    imageNodes: [...state.imageNodes, { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36), ...node }],
  })),
  removeImageNode: (id) => set((state) => ({
    imageNodes: state.imageNodes.filter(n => n.id !== id),
    mode27Connections: state.mode27Connections.filter(c => c.imageId !== id),
  })),
  updateImageNodePosition: (id, x, y) => set((state) => ({
    imageNodes: state.imageNodes.map(n => n.id === id ? { ...n, x, y } : n),
  })),
  updateImageNode: (id, updates) => set((state) => ({
    imageNodes: state.imageNodes.map(n => n.id === id ? { ...n, ...updates } : n),
  })),

  addPromptNode: (node) => set((state) => ({
    promptNodes: [...state.promptNodes, { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36), ...node }],
  })),
  removePromptNode: (id) => set((state) => ({
    promptNodes: state.promptNodes.filter(n => n.id !== id),
    mode27Connections: state.mode27Connections.filter(c => c.promptId !== id),
    mode27PromptConns: state.mode27PromptConns.filter(c => c.fromPromptId !== id && c.toPromptId !== id),
  })),
  updatePromptNodePosition: (id, x, y) => set((state) => ({
    promptNodes: state.promptNodes.map(n => n.id === id ? { ...n, x, y } : n),
  })),
  updatePromptNode: (id, updates) => set((state) => ({
    promptNodes: state.promptNodes.map(n => n.id === id ? { ...n, ...updates } : n),
  })),

  addPromptImageNode: (node) => set((state) => ({
    promptImageNodes: [...state.promptImageNodes, { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36), ...node }],
  })),
  removePromptImageNode: (id) => set((state) => ({
    promptImageNodes: state.promptImageNodes.filter(n => n.id !== id),
    mode27ImageConns: state.mode27ImageConns.filter(c => c.promptImageId !== id),
  })),
  updatePromptImageNodePosition: (id, x, y) => set((state) => ({
    promptImageNodes: state.promptImageNodes.map(n => n.id === id ? { ...n, x, y } : n),
  })),
  updatePromptImageNode: (id, updates) => set((state) => ({
    promptImageNodes: state.promptImageNodes.map(n => n.id === id ? { ...n, ...updates } : n),
  })),

  addMode27ImageConn: (conn) => set((state) => ({
    mode27ImageConns: [...state.mode27ImageConns, { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36), ...conn }],
  })),
  removeMode27ImageConn: (id) => set((state) => ({
    mode27ImageConns: state.mode27ImageConns.filter(c => c.id !== id),
  })),

  addMode27Connection: (conn) => set((state) => ({
    mode27Connections: [...state.mode27Connections, { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36), ...conn }],
  })),
  removeMode27Connection: (id) => set((state) => ({
    mode27Connections: state.mode27Connections.filter(c => c.id !== id),
  })),
  addMode27PromptConn: (conn) => set((state) => ({
    mode27PromptConns: [...state.mode27PromptConns, { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36), ...conn }],
  })),
  removeMode27PromptConn: (id) => set((state) => ({
    mode27PromptConns: state.mode27PromptConns.filter(c => c.id !== id),
  })),
  setMode27Generating: (v) => set({ mode27Generating: v }),
  setMode27Tokens: (v) => set({ mode27Tokens: v }),
  setMode27Result: (v) => set({ mode27Result: v }),

  setQuickGenerate: (v) => set({ quickGenerate: v }),
  setQuickLoading: (v) => set({ quickLoading: v }),
  setShowImportModal: (v) => set({ showImportModal: v }),

  addQuickResult: (r) => set((state) => {
    const updated = [...state.quickResults, { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36), ...r, createdAt: Date.now() }]
    saveQuickResults(updated)
    return { quickResults: updated }
  }),

  removeQuickResult: (id) => set((state) => {
    const updated = state.quickResults.filter(r => r.id !== id)
    saveQuickResults(updated)
    return { quickResults: updated }
  }),
}))

export { CATEGORY_ICONS, loadData, GRID_SIZE, snapToGrid, findConnectedGraph }

