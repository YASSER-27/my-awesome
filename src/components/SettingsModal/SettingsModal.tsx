import { useState } from 'react'
import { useAppStore, PROVIDER_CONFIGS } from '../../store'
import { ApiProvider } from '../../types'
import './SettingsModal.css'
import profilePic from '../../assets/yasser.jpg'

interface Props {
  onClose: () => void
}

const PROVIDERS: { id: ApiProvider; label: string }[] = [
  { id: 'llama', label: 'llama.cpp' },
  { id: 'ollama', label: 'Ollama' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'openrouter', label: 'OpenRouter' },
]

export default function SettingsModal({ onClose }: Props) {
  const apiSettings = useAppStore(s => s.apiSettings)
  const setApiProvider = useAppStore(s => s.setApiProvider)
  const setApiBaseUrl = useAppStore(s => s.setApiBaseUrl)
  const setApiModel = useAppStore(s => s.setApiModel)
  const setApiKey = useAppStore(s => s.setApiKey)
  const setApiConnected = useAppStore(s => s.setApiConnected)
  const setApiDisableReasoning = useAppStore(s => s.setApiDisableReasoning)
  const setApiGamePrompt = useAppStore(s => s.setApiGamePrompt)

  const [selectedProvider, setSelectedProvider] = useState<ApiProvider>(apiSettings.provider)
  const [localUrl, setLocalUrl] = useState(apiSettings.baseUrl)
  const [localKey, setLocalKey] = useState(apiSettings.apiKey)
  const [localModel, setLocalModel] = useState(apiSettings.model)
  const [disableReasoning, setDisableReasoning] = useState(!!apiSettings.disableReasoning)
  const [fetchedModels, setFetchedModels] = useState<string[]>([])
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [saved, setSaved] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showGamePrompt, setShowGamePrompt] = useState(false)
  const [localGamePrompt, setLocalGamePrompt] = useState(apiSettings.gameSystemPrompt || '')
  const [modelSearch, setModelSearch] = useState('')

  const isLocal = selectedProvider === 'ollama'
  const isCloud = !isLocal

  const handleConnect = async () => {
    setConnecting(true)
    setConnectError('')
    setFetchedModels([])
    setConnected(false)
    try {
      let url = ''
      const headers: Record<string, string> = {}
      if (selectedProvider === 'llama') {
        url = `${localUrl.replace(/\/+$/, '')}/v1/models`
      } else if (selectedProvider === 'ollama') {
        url = `${localUrl.replace(/\/+$/, '')}/api/tags`
      } else if (selectedProvider === 'openai') {
        url = 'https://api.openai.com/v1/models'
        if (localKey) headers['Authorization'] = `Bearer ${localKey}`
      } else if (selectedProvider === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/models'
        if (localKey) headers['Authorization'] = `Bearer ${localKey}`
      } else if (selectedProvider === 'gemini') {
        url = 'https://generativelanguage.googleapis.com/v1beta/models'
        if (localKey) headers['x-goog-api-key'] = localKey
      }
      if (!url) throw new Error('No URL configured')
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error(`Connection failed: ${res.status} ${res.statusText}`)
      let models: string[] = []
      try {
        const data = await res.json()
        models = data.data?.map((m: any) => m.id || m.name) || data.models?.map((m: any) => m.name || m.model) || []
      } catch (jsonErr) {
        throw jsonErr
      }
      if (models.length === 0) throw new Error('No models found')
      setFetchedModels(models)
      setConnected(true)
      setApiConnected(true)
      setLocalModel(models[0])
    } catch (err: any) {
      setConnectError(err.message || 'Connection failed')
    }
    setConnecting(false)
  }

  const handleDone = () => {
    setApiProvider(selectedProvider)
    setApiBaseUrl(localUrl)
    setApiKey(localKey)
    setApiModel(localModel)
    setApiDisableReasoning(disableReasoning)
    setApiGamePrompt(localGamePrompt)
    setSaved(true)
    setTimeout(onClose, 400)
  }

  const providerIcon = (id: ApiProvider) => {
    if (id === 'llama') return <svg viewBox="0 0 512 512" width="20" height="20"><path d="m356.4 201.3-32.8 58.3c-43.3-33.3-107.4-38.2-150.7-2.4-69.8 57.6-64.9 190.8 43.7 191.6 30.4 0 56.2-14.3 83.9-23.8l14.6 58.1c-24.6 11.4-49.6 23.1-76.6 26.7-246 33.5-231.9-321.6-9.5-340.1 46.7-3.9 87.8 8.3 127.6 31.6zm-169.9-55.9c-37.4 11.2-72.2 31.8-98.5 60.8-4.9-58.8 8.3-177.7 73.7-201 9.7-3.4 43-11.9 42.1 5.3-1 17.3-24.1 46.9-29.7 63-9.7 28.2-.7 47.6 12.6 72.2zm92.4 252.8h-36.5v-41.3h-41.3v-34h37.7l3.6-3.6v-40.1h36.5V323h38.9v34h-38.9zm133.7-41.3v41.3h-36.5v-41.3h-38.9v-34h38.9v-43.8h36.5v40.1l3.6 3.6h37.7v34h-41.3zM305.4 31.4c4.9 7.3-22.6 38.7-27 46.7-12.6 23.8-4.1 37.4 5.3 60-27.5-4.1-53-.7-80.2 2.4C209.6 88.3 239 12.2 305.4 31.4" fill="#ff8236"/></svg>
    if (id === 'ollama') return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7.905 1.09c.216.085.411.225.588.41.295.306.544.744.734 1.263.191.522.315 1.1.362 1.68a5.054 5.054 0 012.049-.636l.051-.004c.87-.07 1.73.087 2.48.474.101.053.2.11.297.17.05-.569.172-1.134.36-1.644.19-.52.439-.957.733-1.264a1.67 1.67 0 01.589-.41c.257-.1.53-.118.796-.042.401.114.745.368 1.016.737.248.337.434.769.561 1.287.23.934.27 2.163.115 3.645l.053.04.026.019c.757.576 1.284 1.397 1.563 2.35.435 1.487.216 3.155-.534 4.088l-.018.021.002.003c.417.762.67 1.567.724 2.4l.002.03c.064 1.065-.2 2.137-.814 3.19l-.007.01.01.024c.472 1.157.62 2.322.438 3.486l-.006.039a.651.651 0 01-.747.536.648.648 0 01-.54-.742c.167-1.033.01-2.069-.48-3.123a.643.643 0 01.04-.617l.004-.006c.604-.924.854-1.83.8-2.72-.046-.779-.325-1.544-.8-2.273a.644.644 0 01.18-.886l.009-.006c.243-.159.467-.565.58-1.12a4.229 4.229 0 00-.095-1.974c-.205-.7-.58-1.284-1.105-1.683-.595-.454-1.383-.673-2.38-.61a.653.653 0 01-.632-.371c-.314-.665-.772-1.141-1.343-1.436a3.288 3.288 0 00-1.772-.332c-1.245.099-2.343.801-2.67 1.686a.652.652 0 01-.61.425c-1.067.002-1.893.252-2.497.703-.522.39-.878.935-1.066 1.588a4.07 4.07 0 00-.068 1.886c.112.558.331 1.02.582 1.269l.008.007c.212.207.257.53.109.785-.36.622-.629 1.549-.673 2.44-.05 1.018.186 1.902.719 2.536l.016.019a.643.643 0 01.095.69c-.576 1.236-.753 2.252-.562 3.052a.652.652 0 01-1.269.298c-.243-1.018-.078-2.184.473-3.498l.014-.035-.008-.012a4.339 4.339 0 01-.598-1.309l-.005-.019a5.764 5.764 0 01-.177-1.785c.044-.91.278-1.842.622-2.59l.012-.026-.002-.002c-.293-.418-.51-.953-.63-1.545l-.005-.024a5.352 5.352 0 01.093-2.49c.262-.915.777-1.701 1.536-2.269.06-.045.123-.09.186-.132-.159-1.493-.119-2.73.112-3.67.127-.518.314-.95.562-1.287.27-.368.614-.622 1.015-.737.266-.076.54-.059.797.042zm4.116 9.09c.936 0 1.8.313 2.446.855.63.527 1.005 1.235 1.005 1.94 0 .888-.406 1.58-1.133 2.022-.62.377-1.421.588-2.318.588s-1.698-.21-2.318-.588c-.727-.442-1.133-1.134-1.133-2.022 0-.705.376-1.413 1.005-1.94.647-.542 1.51-.855 2.446-.855z"/></svg>
    if (id === 'gemini') return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    if (id === 'openai') return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5097-2.9161A5.9852 5.9852 0 0 0 10.254 1.42a6.0431 6.0431 0 0 0-5.4395 4.4811A5.9858 5.9858 0 0 0 .839 11.48a6.0435 6.0435 0 0 0 2.9162 6.5097 5.9847 5.9847 0 0 0 .5157 4.9108 6.0462 6.0462 0 0 0 6.5097 2.9161 5.9852 5.9852 0 0 0 4.9108.5157 6.0431 6.0431 0 0 0 5.4395-4.4811 5.9858 5.9858 0 0 0 4.2384-5.579 6.0435 6.0435 0 0 0-2.9162-6.5097zm-10.568 12.1a4.0317 4.0317 0 0 1-2.2688.69 4.0493 4.0493 0 0 1-3.4441-2.0441 3.9843 3.9843 0 0 1-.413-3.2119 4.0603 4.0603 0 0 1 2.0791-2.7387l2.1745 3.4276a1.3581 1.3581 0 0 0 1.4562.5927 1.34 1.34 0 0 0 .9407-.9976 1.08 1.08 0 0 0 .001-.5981l-2.992-4.7169a4.0613 4.0613 0 0 1 2.9059-.412 4.0357 4.0357 0 0 1 2.7208 2.4603 3.9977 3.9977 0 0 1 .4226 3.0481 4.0523 4.0523 0 0 1-2.5648 2.7026 3.9967 3.9967 0 0 1-.9063.2133 4.073 4.073 0 0 1-1.1079.0661z"/></svg>
    return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2l-.4 2.5c-.3.2-.6.4-.9.7L8.5 4.3l-1 1.8 1.8 1.2c-.1.3-.2.6-.3 1l-2.5.4V10l2.5.4c.1.3.2.6.3 1l-1.8 1.2 1 1.8 1.8-1.2c.3.3.6.5.9.7l.4 2.5h2l.4-2.5c.3-.2.6-.4.9-.7l1.8 1.2 1-1.8-1.8-1.2c.1-.3.2-.6.3-1l2.5-.4V8l-2.5-.4c-.1-.3-.2-.6-.3-1l1.8-1.2-1-1.8-1.8 1.2c-.3-.3-.6-.5-.9-.7L14 2h-2z"/></svg>
  }

  return (
    <div className="import-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="import-header">
          <h2 className="import-title">API Settings</h2>
          <button className="import-close" onClick={onClose}>✕</button>
        </div>

        <div className="import-body">
          <label className="import-field-label">Provider</label>
          <div className="settings-provider-grid">
            {PROVIDERS.map(p => (
              <button key={p.id}
                onClick={() => {
                  setShowInfo(false);
                  setSelectedProvider(p.id);
                  setConnected(false);
                  setFetchedModels([]);
                  setConnectError('');
                  setApiConnected(false);
                  setLocalUrl(p.id === 'llama' ? 'http://localhost:8080' : (p.id === 'ollama' ? 'http://127.0.0.1:11434' : ''));
                }}
                className={`settings-provider-btn${selectedProvider === p.id ? ' active' : ''}`}
              >
                {providerIcon(p.id)}
                <span>{p.label}</span>
              </button>
            ))}
            <button onClick={() => { setShowInfo(true); setShowGamePrompt(false) }}
              className={`settings-provider-btn${showInfo ? ' active' : ''}`}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              <span>INFO</span>
            </button>
            <button onClick={() => { setShowGamePrompt(true); setShowInfo(false) }}
              className={`settings-provider-btn${showGamePrompt ? ' active' : ''}`}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 6h-2v2h2V6zm0 4h-2v2h2v-2zm-4-4h-2v8h2V6zm-4 0H9v12h4V6zm-6 0H3v4h2V6zm0 6H3v6h2v-6z"/></svg>
              <span>Game Prompt</span>
            </button>
          </div>

          <div style={{ height: 1, background: '#2a2a2a', margin: '8px 0' }} />

          {showInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', padding: 12, background: '#111', borderRadius: 8, border: '1px solid #2a2a2a' }}>
              <img src={profilePic} alt="Yasser" draggable={false}
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #667eea', userSelect: 'none' }} />
              <div style={{ fontSize: 10, color: '#aaa', lineHeight: 1.5, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#e0e0e0', fontSize: 11, marginBottom: 4 }}>
                  My Awesome — Component Builder
                </div>
                <p style={{ margin: '2px 0' }}>
                  Built with <strong style={{ color: '#e0e0e0' }}>React + Electron + Zustand</strong>.
                  Drag & drop components, generate UI with AI, and export your designs.
                </p>
                <p style={{ margin: '4px 0 2px', fontWeight: 600, color: '#ccc' }}>Shortcuts:</p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', textAlign: 'center' }}>
                  <li><strong style={{ color: '#e0e0e0' }}>Ctrl+N</strong> — Open Quick Configurator</li>
                  <li><strong style={{ color: '#e0e0e0' }}>Ctrl+O</strong> — Open Import Design</li>
                  <li><strong style={{ color: '#e0e0e0' }}>Ctrl+Z/Y</strong> — Undo / Redo</li>
                  <li><strong style={{ color: '#e0e0e0' }}>F2</strong> — Rename selected element</li>
                  <li><strong style={{ color: '#e0e0e0' }}>F6</strong> — Start / Stop llama.cpp server</li>
                  <li><strong style={{ color: '#e0e0e0' }}>F7</strong> — Trigger AI generation</li>
                  <li><strong style={{ color: '#e0e0e0' }}>Tab</strong> — Toggle Source / Designer</li>
                </ul>
                <p style={{ margin: '4px 0 0', color: '#888' }}>
                  Special thanks to <a href="https://github.com/ggml-org/llama.cpp" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#00c8ff', textDecoration: 'none' }}>llama.cpp</a> —
                  the incredible open-source LLM inference engine that powers local AI generation.
                </p>
                <p style={{ margin: '4px 0 0', color: '#888' }}>
                  Made by{' '}
                  <a href="https://github.com/YASSER-27" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#00c8ff', textDecoration: 'none', fontWeight: 600 }}>Yasser</a>
                  . If you find this tool useful, please consider supporting my work on GitHub.
                </p>
              </div>
            </div>
          ) : showGamePrompt ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: '#111', borderRadius: 8, border: '1px solid #2a2a2a' }}>
              <label className="import-field-label">Game System Prompt</label>
              <p style={{ fontSize: 10, color: '#888', margin: 0, lineHeight: 1.4 }}>
                Customize the system prompt used when generating games via the "Create Game" AI action.
                Leave empty to use the default built-in prompt.
              </p>
              <textarea value={localGamePrompt}
                onChange={e => setLocalGamePrompt(e.target.value)}
                placeholder="(Uses default built-in game prompt)"
                style={{
                  width: '100%', minHeight: 200, resize: 'vertical', background: '#1a1a1a', color: '#e0e0e0',
                  border: '1px solid #333', borderRadius: 6, padding: 10, fontSize: 11, fontFamily: 'Consolas, monospace',
                  lineHeight: 1.5, outline: 'none',
                }}
              />
              <button onClick={() => setLocalGamePrompt('')}
                style={{
                  alignSelf: 'flex-end', background: 'transparent', border: '1px solid #444', color: '#888',
                  padding: '6px 14px', borderRadius: 6, fontSize: 11, cursor: 'pointer'
                }}>
                Reset to Default
              </button>
            </div>
          ) : (
            <>
              {isLocal ? (
                <div className="import-field">
                  <label className="import-field-label">Base URL</label>
                  <input className="import-name-input" value={localUrl}
                    onChange={e => { setLocalUrl(e.target.value); setConnected(false); setFetchedModels([]); setConnectError('') }}
                    placeholder="http://127.0.0.1:11434" />
                </div>
              ) : (
                <div className="import-field">
                  <label className="import-field-label">API Key</label>
                  <input className="import-name-input" value={localKey}
                    onChange={e => { setLocalKey(e.target.value); setConnected(false); setFetchedModels([]); setConnectError('') }}
                    placeholder="sk-..." type="password" />
                </div>
              )}

              {!connected && (
                <button onClick={handleConnect} disabled={connecting || (isCloud && !localKey)}
                  className="settings-connect-btn">
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
              )}

              {connectError && (
                <div className="settings-error">{connectError}</div>
              )}

              {connected && fetchedModels.length > 0 && (
                <>
                  <div style={{ height: 1, background: '#2a2a2a', margin: '8px 0' }} />
                  <label className="import-field-label">Select Model ({fetchedModels.length} available)</label>
                  <input className="import-name-input" value={modelSearch}
                    onChange={e => setModelSearch(e.target.value)}
                    placeholder="Search models..." style={{ marginBottom: 6, fontSize: 13, padding: '8px 10px' }} />
                  <div className="settings-model-list">
                    {fetchedModels.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase())).map(m => (
                      <button key={m} onClick={() => setLocalModel(m)}
                        className={`settings-model-chip${localModel === m ? ' active' : ''}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="import-footer">
          {showInfo ? (
            <button className="import-cancel" onClick={onClose}>Close</button>
          ) : showGamePrompt ? (
            <button onClick={handleDone} className="settings-done-btn">
              {saved ? 'Saved!' : 'Done'}
            </button>
          ) : connected ? (
            <button onClick={handleDone} className="settings-done-btn">
              {saved ? 'Saved!' : 'Done'}
            </button>
          ) : (
            <button className="import-cancel" onClick={onClose}>Cancel</button>
          )}
        </div>
      </div>
    </div>
  )
}