import { useRef, useEffect, memo } from 'react'

interface Props {
  html: string
  css?: string
  js?: string
  maxHeight?: number
}

function ComponentPreview({ html, css, js, maxHeight }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<ShadowRoot | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    if (js) {
      // Strip imports (including semicolon-separated on same line); handle export default
      let exportedName = ''
      const cleanJs = (js || '')
        .replace(/import\s[^;]+(?:;|$)/gm, '')
        .replace(/\bexport\s+default\s+function\s+(\w+)/g, (_, name) => { exportedName = name; return 'function ' + name })
        .replace(/\bexport\s+default\s+/g, '')
        .replace(/\bexport\s+/g, '')
        .trim() + (exportedName ? '\nconst __App = ' + exportedName + ';' : '')
      const base = window.location.origin
      const doc = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script crossorigin src="${base}/assets/react.production.min.js"><\/script>
<script crossorigin src="${base}/assets/react-dom.production.min.js"><\/script>
<script crossorigin src="${base}/assets/babel.min.js"><\/script>
<script crossorigin src="https://unpkg.com/@mui/material@5/umd/material-ui.production.min.js"><\/script>
<script crossorigin src="https://cdn.jsdelivr.net/npm/react-transition-group@4/dist/react-transition-group.min.js"><\/script>
<style>${css || ''}*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#e0e0e0;padding:8px;min-height:100vh}</style>
</head>
<body>
<div id="root">${html || ''}</div>
<script type="text/babel" data-presets="react,typescript">
const { useState, useCallback, useEffect, useRef, useMemo, createElement, Fragment } = React;
const { TransitionGroup, CSSTransition, Transition } = ReactTransitionGroup || {};
const {
  Button, List, ListItem, ListItemText, Collapse, IconButton, TextField,
  AppBar, Toolbar, Typography, Card, CardContent, Box, Chip, Switch, Slider,
  Select, MenuItem, Checkbox, Radio, RadioGroup, FormControlLabel, FormControl,
  FormLabel, Grid, Paper, Alert, Avatar, Badge, Snackbar, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, SvgIcon,
} = MaterialUI;
const DeleteIcon = MaterialUI.Icons?.Delete || ((props) => React.createElement('svg', { viewBox: '0 0 24 24', width: 24, height: 24, fill: 'currentColor', ...props }, React.createElement('path', { d: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z' })));
const __root = document.getElementById('root');
(function() {
  try {
    ${cleanJs || ''}
  } catch(e) { __root.innerHTML = '<span style=color:#f44;font-size:12px>JS Error: ' + e.message + '<\/span>'; return }
  if (typeof __App !== 'undefined') { ReactDOM.createRoot(__root).render(React.createElement(__App)); __root.__rendered = true }
})();
if (!__root.__rendered) __root.innerHTML = '<span style=color:#888;font-size:11px>Write a function App() that returns JSX.</span>'
<\/script>
</body>
</html>`
      if (iframeRef.current) {
        iframeRef.current.srcdoc = doc
      } else {
        const el = ref.current
        if (!el) return
        el.replaceChildren()
        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'width:100%;height:100%;border:none;background:transparent'
        iframe.srcdoc = doc
        iframeRef.current = iframe
        el.appendChild(iframe)
      }
      return
    }
    iframeRef.current = null
    const el = ref.current
    if (!el) return
    if (!shadowRef.current) {
      shadowRef.current = el.attachShadow({ mode: 'open' })
    }
    const root = shadowRef.current
    root.replaceChildren()
    const baseStyle = document.createElement('style')
    baseStyle.textContent = '*{box-sizing:border-box;margin:0;padding:0}:host{all:initial;display:block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#e0e0e0}'
    root.appendChild(baseStyle)
    if (css) {
      const styleEl = document.createElement('style')
      styleEl.textContent = css
      root.appendChild(styleEl)
    }
    const wrapper = document.createElement('div')
    wrapper.innerHTML = html
    root.appendChild(wrapper)
  }, [html, css, js])

  return (
    <div
      ref={ref}
      className="component-preview-root"
      style={{ maxHeight: maxHeight || 9999, overflow: 'hidden', pointerEvents: 'none' }}
    />
  )
}

export default memo(ComponentPreview, (prev, next) =>
  prev.html === next.html && prev.css === next.css && prev.js === next.js && prev.maxHeight === next.maxHeight
)
