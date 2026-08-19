import { create } from 'zustand'

export type PanelId = 'tools' | 'categories' | 'imports' | 'generate-tab' | 'ai-tab' | 'quick-tab'

export type PanelZone = 'left' | 'right'

export const ALL_PANEL_IDS: PanelId[] = ['tools', 'categories', 'imports', 'generate-tab', 'ai-tab', 'quick-tab']

const DEFAULT_LEFT: PanelId[] = ['tools', 'categories', 'imports']
const DEFAULT_RIGHT: PanelId[] = ['generate-tab', 'ai-tab', 'quick-tab']

interface DockStore {
  leftPanels: PanelId[]
  rightPanels: PanelId[]
  draggedPanelId: PanelId | null
  sourceZone: PanelZone | null
  dragOverZone: PanelZone | null
  startDrag: (id: PanelId, from: PanelZone) => void
  endDrag: () => void
  setDragOverZone: (zone: PanelZone | null) => void
  cancelDrag: () => void
  resetLayout: () => void
}

export const useDockStore = create<DockStore>((set, get) => ({
  leftPanels: [...DEFAULT_LEFT],
  rightPanels: [...DEFAULT_RIGHT],
  draggedPanelId: null,
  sourceZone: null,
  dragOverZone: null,

  startDrag: (id, from) => set({ draggedPanelId: id, sourceZone: from }),
  cancelDrag: () => set({ draggedPanelId: null, sourceZone: null, dragOverZone: null }),

  endDrag: () => {
    const { sourceZone, dragOverZone } = get()
    if (sourceZone && dragOverZone && sourceZone !== dragOverZone) {
      // Swap all panels between zones
      set((state) => ({
        leftPanels: [...state.rightPanels],
        rightPanels: [...state.leftPanels],
        draggedPanelId: null,
        sourceZone: null,
        dragOverZone: null,
      }))
    } else {
      set({ draggedPanelId: null, sourceZone: null, dragOverZone: null })
    }
  },

  setDragOverZone: (zone) => set({ dragOverZone: zone }),

  resetLayout: () => set({
    leftPanels: [...DEFAULT_LEFT],
    rightPanels: [...DEFAULT_RIGHT],
    draggedPanelId: null,
    sourceZone: null,
    dragOverZone: null,
  }),
}))
