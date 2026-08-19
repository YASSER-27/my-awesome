import { useState, useCallback } from 'react'
import { ALL_CATEGORIES, QUICK_CONFIGS, PLACEMENT_FIELDS, buildQuickPrompt, buildWholePagePrompt, GLOBAL_SETTINGS_FIELDS } from './quickConfigData'
import wholePageImg from '../../assets/whole page.webp'
import singleComponentImg from '../../assets/single comonent.webp'
import './QuickConfigurator.css'

interface Props {
  onClose: () => void
  onGenerate: (prompt: string, category?: string) => void
}

export default function QuickConfigurator({ onClose, onGenerate }: Props) {
  const [step, setStep] = useState<'choose' | 'global' | 'categories' | 'configure' | 'single-category'>('choose')
  const [wizardIndex, setWizardIndex] = useState(0)

  // Whole-page
  const [selectedCats, setSelectedCats] = useState<string[]>(['Navigation', 'Cards', 'Buttons'])
  const [globalSettings, setGlobalSettings] = useState<Record<string, any>>({})
  const [perCategoryValues, setPerCategoryValues] = useState<Record<string, Record<string, any>>>({})
  const [perCategoryExplain, setPerCategoryExplain] = useState<Record<string, string>>({})

  // Single-category
  const [selectedCat, setSelectedCat] = useState('Buttons')
  const [values, setValues] = useState<Record<string, any>>({})
  const [explainText, setExplainText] = useState('')

  const toggleCat = useCallback((cat: string) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }, [])

  const setVal = useCallback((id: string, val: any) => {
    setValues(prev => ({ ...prev, [id]: val }))
  }, [])

  const setPerCatVal = useCallback((cat: string, id: string, val: any) => {
    setPerCategoryValues(prev => ({
      ...prev,
      [cat]: { ...(prev[cat] || {}), [id]: val },
    }))
  }, [])

  const setPerCatExplain = useCallback((cat: string, val: string) => {
    setPerCategoryExplain(prev => ({ ...prev, [cat]: val }))
  }, [])

  const currentCategory = step === 'configure' ? selectedCats[wizardIndex] : selectedCat
  const currentFields = currentCategory ? QUICK_CONFIGS[currentCategory] || [] : []

  const handleGenerate = () => {
    if (step === 'single-category') {
      const prompt = buildQuickPrompt(selectedCat, values, explainText)
      onGenerate(prompt, selectedCat)
    } else {
      const prompt = buildWholePagePrompt(selectedCats, globalSettings, perCategoryValues, perCategoryExplain)
      onGenerate(prompt, 'whole-page')
    }
  }

  const renderField = (field: typeof currentFields[0], vals: Record<string, any>, setFn: (id: string, val: any) => void) => {
    const val = vals[field.id]
    const isMulti = field.type === 'multi-select'
    const selVals: string[] = isMulti ? (val || []) : []
    const selVal: string = !isMulti ? (val || '') : ''

    if (field.type === 'multi-select') {
      return (
        <div className="qc-chips">
          {field.options?.map(opt => (
            <button key={opt}
              className={'qc-chip' + (selVals.includes(opt) ? ' selected' : '')}
              onClick={() => {
                const next = selVals.includes(opt) ? selVals.filter(v => v !== opt) : [...selVals, opt]
                setFn(field.id, next)
              }}
            >{opt}</button>
          ))}
        </div>
      )
    }

    if (field.type === 'single-select') {
      return (
        <div className="qc-chips">
          {field.options?.map(opt => (
            <button key={opt}
              className={'qc-chip' + (selVal === opt ? ' active' : '')}
              onClick={() => setFn(field.id, selVal === opt ? '' : opt)}
            >{opt}</button>
          ))}
        </div>
      )
    }

    if (field.type === 'number') {
      return (
        <input type="number" className="qc-number" min={field.min} max={field.max}
          value={val ?? ''} onChange={e => setFn(field.id, e.target.value ? Number(e.target.value) : '')}
          placeholder={`${field.min}–${field.max}`} />
      )
    }

    if (field.type === 'toggle') {
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#ccc' }}>
          <input type="checkbox" checked={!!val} onChange={e => setFn(field.id, e.target.checked)}
            style={{ accentColor: '#667eea' }} />
          {val ? 'Yes' : 'No'}
        </label>
      )
    }

    return null
  }

  // Mode selection
  const renderChoose = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 0' }}>
      <button onClick={() => { setSelectedCats(['Navigation', 'Cards', 'Buttons']); setPerCategoryValues({}); setPerCategoryExplain({}); setGlobalSettings({}); setValues({}); setExplainText(''); setStep('global') }}
        style={{
          padding: 0, borderRadius: 12, border: '1px solid #333', cursor: 'pointer',
          height: 120, overflow: 'hidden', position: 'relative',
          backgroundImage: `url(${wholePageImg})`, backgroundSize: 'cover', backgroundPosition: 'center',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#667eea'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#333'}
      >
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
          color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: 0.5,
        }}>
          Whole Page
        </div>
      </button>
      <button onClick={() => { setSelectedCat('Buttons'); setValues({}); setExplainText(''); setStep('single-category') }}
        style={{
          padding: 0, borderRadius: 12, border: '1px solid #333', cursor: 'pointer',
          height: 120, overflow: 'hidden', position: 'relative',
          backgroundImage: `url(${singleComponentImg})`, backgroundSize: 'cover', backgroundPosition: 'center',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#f093fb'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#333'}
      >
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
          color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: 0.5,
        }}>
          Single Component
        </div>
      </button>
    </div>
  )

  // Global settings
  const renderGlobalSettings = () => (
    <>
      <p style={{ fontSize: 12, color: '#999', marginBottom: 14 }}>Configure global settings for your page before configuring each section.</p>
      {GLOBAL_SETTINGS_FIELDS.map(field => (
        <div className="qc-field" key={field.id}>
          <label className="qc-field-label">{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea className="qc-textarea" value={globalSettings[field.id] || ''}
              onChange={e => setGlobalSettings(prev => ({ ...prev, [field.id]: e.target.value }))}
              placeholder={field.placeholder} />
          ) : (
            <div className="qc-chips">
              {field.options?.map(opt => (
                <button key={opt}
                  className={'qc-chip' + (globalSettings[field.id] === opt ? ' active' : '')}
                  onClick={() => setGlobalSettings(prev => ({ ...prev, [field.id]: prev[field.id] === opt ? '' : opt }))}
                >{opt}</button>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  )

  // Category selection
  const renderCategorySelection = () => (
    <>
      <p style={{ fontSize: 12, color: '#999', marginBottom: 14 }}>Select which sections to include in your page.</p>
      <div className="qc-checkbox-grid">
        {ALL_CATEGORIES.map(cat => (
          <label key={cat} className="qc-checkbox-item">
            <input type="checkbox" checked={selectedCats.includes(cat)}
              onChange={() => toggleCat(cat)} />
            {cat}
          </label>
        ))}
      </div>
      {selectedCats.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#666' }}>
          Order: {selectedCats.map((c, i) => (
            <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 6 }}>
              {i > 0 && <span style={{ color: '#444' }}>→</span>}
              <button className="qc-back-btn" onClick={() => {
                const newArr = [...selectedCats]
                if (i > 0) { [newArr[i - 1], newArr[i]] = [newArr[i], newArr[i - 1]]; setSelectedCats(newArr) }
              }} style={{ visibility: i > 0 ? 'visible' : 'hidden' }}>↑</button>
              <span>{c}</span>
              <button className="qc-back-btn" onClick={() => {
                const newArr = [...selectedCats]
                if (i < selectedCats.length - 1) { [newArr[i], newArr[i + 1]] = [newArr[i + 1], newArr[i]]; setSelectedCats(newArr) }
              }} style={{ visibility: i < selectedCats.length - 1 ? 'visible' : 'hidden' }}>↓</button>
            </span>
          ))}
        </div>
      )}
    </>
  )

  // Per-category configurator (used in wizard and single mode)
  const renderCategoryConfig = (vals: Record<string, any>, setFn: (id: string, val: any) => void, explain: string, setExplain: (v: string) => void) => {
    const fields = QUICK_CONFIGS[currentCategory] || []
    return (
      <>
        {fields.map(field => (
          <div className="qc-field" key={field.id}>
            <label className="qc-field-label">{field.label}</label>
            {renderField(field, vals, setFn)}
          </div>
        ))}
        <hr className="qc-separator" />
        <p style={{ fontSize: 11, color: '#777', marginBottom: 8 }}>Placement</p>
        {PLACEMENT_FIELDS.map(field => (
          <div className="qc-field" key={field.id}>
            <label className="qc-field-label">{field.label}</label>
            {renderField(field, vals, setFn)}
          </div>
        ))}
        <hr className="qc-separator" />
        <div className="qc-field">
          <label className="qc-field-label">Or describe it yourself</label>
          <textarea className="qc-textarea" value={explain}
            onChange={e => setExplain(e.target.value)}
            placeholder="Type any custom instructions here..." />
        </div>
      </>
    )
  }

  const title = step === 'choose' ? 'Quick Configurator'
    : step === 'global' ? 'Page Settings'
    : step === 'categories' ? 'Select Sections'
    : step === 'configure' ? `Configure: ${selectedCats[wizardIndex]}`
    : `Single Component: ${selectedCat}`

  return (
    <div className="qc-overlay" onClick={onClose}>
      <div className="qc-modal" onClick={e => e.stopPropagation()}>
        {/* Progress for wizard */}
        {step !== 'choose' && step !== 'single-category' && (
          <div className="qc-progress">
            {step === 'global' && <><span style={{ color: '#e0e0e0' }}>Settings</span><div className="qc-progress-bar"><div className="qc-progress-fill" style={{ width: '0%' }} /></div><span style={{ color: '#888' }}>Sections</span></>}
            {step === 'categories' && <><span style={{ color: '#888' }}>Settings</span><div className="qc-progress-bar"><div className="qc-progress-fill" style={{ width: '50%' }} /></div><span style={{ color: '#e0e0e0' }}>Sections</span></>}
            {step === 'configure' && (
              <><button className="qc-back-btn" onClick={() => setStep('categories')}>← Back</button>
              <span>Step {wizardIndex + 1} of {selectedCats.length}</span>
              <div className="qc-progress-bar"><div className="qc-progress-fill" style={{ width: `${((wizardIndex + 1) / selectedCats.length) * 100}%` }} /></div>
              <span style={{ color: '#888', fontSize: 10 }}>{selectedCats[wizardIndex]}</span></>
            )}
          </div>
        )}

        <div className="qc-header">
          <h2>{title}</h2>
          <button className="qc-close" onClick={onClose}>×</button>
        </div>

        <div className="qc-body">
          {step === 'choose' && renderChoose()}
          {step === 'global' && renderGlobalSettings()}
          {step === 'categories' && renderCategorySelection()}
          {step === 'configure' && renderCategoryConfig(
            perCategoryValues[currentCategory] || {},
            (id, val) => setPerCatVal(currentCategory, id, val),
            perCategoryExplain[currentCategory] || '',
            (v) => setPerCatExplain(currentCategory, v),
          )}
          {step === 'single-category' && (
            <>
              <div className="qc-field">
                <label className="qc-field-label">Category</label>
                <div className="qc-chips">
                  {ALL_CATEGORIES.map(cat => (
                    <button key={cat}
                      className={'qc-chip' + (selectedCat === cat ? ' active' : '')}
                      onClick={() => { setSelectedCat(selectedCat === cat ? 'Buttons' : cat); if (selectedCat !== cat) setValues({}) }}
                    >{cat}</button>
                  ))}
                </div>
              </div>
              {renderCategoryConfig(values, setVal, explainText, setExplainText)}
            </>
          )}
        </div>

        <div className="qc-footer">
          {step === 'choose' ? (
            <>
              <button className="qc-cancel" onClick={onClose}>Back</button>
              <button className="qc-cancel" onClick={onClose}>Cancel</button>
            </>
          ) : step === 'global' ? (
            <>
              <button className="qc-cancel" onClick={() => setStep('choose')}>Back</button>
              <button className="qc-cancel" onClick={onClose}>Cancel</button>
              <button className="qc-generate" onClick={() => setStep('categories')}>Next: Sections</button>
            </>
          ) : step === 'categories' ? (
            <>
              <button className="qc-cancel" onClick={() => setStep('global')}>Back</button>
              <button className="qc-cancel" onClick={onClose}>Cancel</button>
              <button className="qc-generate" onClick={() => { setWizardIndex(0); setStep('configure') }}
                disabled={selectedCats.length === 0}>
                Next: {selectedCats[0]}
              </button>
            </>
          ) : step === 'configure' ? (
            <>
              <button className="qc-cancel" onClick={() => setStep('categories')}>Back</button>
              <button className="qc-cancel" onClick={onClose}>Cancel</button>
              {wizardIndex < selectedCats.length - 1 ? (
                <button className="qc-generate" onClick={() => setWizardIndex(i => i + 1)}>
                  Next: {selectedCats[wizardIndex + 1]}
                </button>
              ) : (
                <button className="qc-generate" onClick={handleGenerate}
                  style={{ background: 'linear-gradient(90deg, #f093fb, #667eea)' }}>
                  Generate Full Page
                </button>
              )}
            </>
          ) : (
            <>
              <button className="qc-cancel" onClick={() => setStep('choose')}>Back</button>
              <button className="qc-cancel" onClick={onClose}>Cancel</button>
              <button className="qc-generate" onClick={handleGenerate}>Generate {selectedCat}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
