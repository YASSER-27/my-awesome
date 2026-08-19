import { useCallback } from 'react'
import { useAppStore } from '../../store'

interface Props {
  connectingAiCategory: { category: string; portIndex: number } | null
  onAiConnectStart: (cat: string | null, portIndex?: number) => void
}

export default function CanvasAiPanel({ connectingAiCategory, onAiConnectStart }: Props) {
  const categories = useAppStore(s => s.categories)
  const aiTargetNodes = useAppStore(s => s.aiTargetNodes)
  const aiConnections = useAppStore(s => s.aiConnections)
  const addAiTargetNode = useAppStore(s => s.addAiTargetNode)

  const isPortConnected = (category: string, portIndex: number) => {
    const node = aiTargetNodes.find(n => n.category === category)
    if (!node) return false
    return aiConnections.some(c => c.aiTargetId === node.id && c.portIndex === portIndex)
  }

  const handleAiAnchorClick = useCallback((category: string, portIndex: number) => {
    if (connectingAiCategory?.category === category && connectingAiCategory?.portIndex === portIndex) {
      onAiConnectStart(null)
      return
    }
    const existing = aiTargetNodes.find(n => n.category === category)
    if (!existing) {
      const count = aiTargetNodes.length
      addAiTargetNode({
        id: `ai-target-${category}`,
        category,
        label: `AI: ${category}`,
        x: 40,
        y: 60 + count * 100,
        width: 160,
        height: 60,
      })
    }
    onAiConnectStart(category, portIndex)
  }, [connectingAiCategory, onAiConnectStart, aiTargetNodes])

  return (
    <div className="border-t shrink-0"
      style={{ backgroundColor: '#121212', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {categories.map(cat => {
          const name = cat.name
          return (
            <div key={name} className="relative flex items-center gap-1.5 px-1.5 py-1 rounded"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <span className="text-[10px] whitespace-nowrap" style={{ color: '#888', fontWeight: 500 }}>{name}</span>
              {[0].map(portIndex => {
                const isConnecting = connectingAiCategory?.category === name && connectingAiCategory?.portIndex === portIndex
                const connected = isPortConnected(name, portIndex)
                return (
                  <div key={portIndex}
                    onClick={(e) => { e.stopPropagation(); handleAiAnchorClick(name, portIndex) }}
                    className="flex items-center justify-center cursor-pointer rounded-sm hover:opacity-80"
                    title={connected ? 'Connected' : 'Click to connect'}
                    style={{ width: 8, height: 16 }}
                  >
                    <div style={{
                      width: 2,
                      height: isConnecting ? 14 : connected ? 12 : 10,
                      borderRadius: 1,
                      backgroundColor: isConnecting ? '#f093fb' : connected ? '#4ade80' : '#4a4a4a',
                      transition: 'all .15s',
                    }} />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
