import { useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Sidebar from './components/Sidebar/Sidebar'
import Canvas from './components/Canvas/Canvas'
import GenerateWindow from './components/GenerateWindow/GenerateWindow'
import { useAppStore, loadData } from './store'
import './App.css'

function App() {
  const categories = useAppStore((s) => s.categories)
  const isLoading = useAppStore((s) => s.isLoading)
  const setCategories = useAppStore((s) => s.setCategories)
  const showGenerateWindow = useAppStore((s) => s.showGenerateWindow)
  const toggleGenerateWindow = useAppStore((s) => s.toggleGenerateWindow)

  useEffect(() => {
    loadData().then(setCategories)
  }, [setCategories])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.key !== 'b') return
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      e.preventDefault()
      toggleGenerateWindow()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleGenerateWindow])

  useEffect(() => {
    document.querySelectorAll('iframe').forEach((frame) => {
      frame.contentWindow?.postMessage({ type: 'generate-window-visible', visible: showGenerateWindow }, '*')
    })
  }, [showGenerateWindow])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'toggle-generate-window') {
        toggleGenerateWindow()
      }
      if (e.data?.type === 'query-generate-window-visible') {
        const visible = useAppStore.getState().showGenerateWindow
        if (e.source && 'postMessage' in e.source) {
          (e.source as Window).postMessage({ type: 'generate-window-visible', visible }, '*')
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [toggleGenerateWindow])

  const total = categories.reduce((sum, c) => sum + c.components.length, 0)

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        {isLoading && categories.length === 0 ? (
          <div className="loading-screen">
            <div className="loading-spinner" />
            <span>Loading {total || 'components'}...</span>
          </div>
        ) : (
          <>
            <Sidebar />
            <div className="canvas-area">
              <Canvas />
            </div>
            <div className={'right-panel' + (showGenerateWindow ? '' : ' right-panel-hidden')}>
              <GenerateWindow />
            </div>
          </>
        )}
      </div>
    </DndProvider>
  )
}

export default App
