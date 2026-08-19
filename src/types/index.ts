export interface ComponentItem {
  id: string
  name: string
  category: string
  type: string
  html: string
  css: string
  js?: string
  description: string
  preview?: string
  source: string
}

export interface ParsedComponent {
  componentName: string
  category: string
  type: string
  html: string
  css: string
  js: string
  description: string
  source: string
}

export interface CanvasElement {
  id: string
  componentId: string
  x: number
  y: number
  width: number
  height: number
  name: string
  category: string
  type: string
  html: string
  css: string
  js?: string
  description: string
  source: string
  mode: 'source' | 'description'
}

export interface Connection {
  id: string
  fromId: string
  toId: string
}

export interface AiTargetNode {
  id: string
  category: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

export interface AiConnection {
  id: string
  aiTargetId: string
  canvasElementId: string
  portIndex: number
}

export interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  createdAt: number
}

export interface Category {
  name: string
  components: ComponentItem[]
  expanded: boolean
}

export type ApiProvider = 'llama' | 'ollama' | 'gemini' | 'openai' | 'openrouter'

export interface ApiSettings {
  provider: ApiProvider
  baseUrl: string
  model: string
  apiKey: string
  connected: boolean
  disableReasoning?: boolean
  gameSystemPrompt?: string
}

export interface SavedImport {
  id: string
  name: string
  html: string
  css: string
  js?: string
  source: string
  createdAt: number
}

export interface ImageNode {
  id: string
  x: number
  y: number
  width: number
  height: number
  base64: string
  name: string
  filePath?: string
}

export interface PromptNode {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  text: string
  colorTag: string
}

export interface Mode27Connection {
  id: string
  imageId: string
  promptId: string
}

export interface Mode27PromptConnection {
  id: string
  fromPromptId: string
  toPromptId: string
}

export const PROMPT_COLORS = ['#00c8ff', '#7c5cff', '#f093fb', '#4ade80', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7']

export interface PromptImageNode {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  prompt: string
  ratio: string
  count: number
  colorTag: string
}

export interface Mode27ImageConnection {
  id: string
  imageId: string
  promptImageId: string
}
