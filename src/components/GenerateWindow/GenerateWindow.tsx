import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Markdown from 'react-markdown'
import { useAppStore, findConnectedGraph, PROVIDER_CONFIGS } from '../../store'
import LottieAnimation from '../common/LottieAnimation'
import type { AiMessage, ApiProvider } from '../../types'
import serverRunningJson from '../../data/tools/Server_running.json'
import serverNotRunningJson from '../../data/tools/Server_not_running.json'
import broomJson from '../../data/tools/Broom.json'
import './GenerateWindow.css'

// Override the oneDark theme: set ALL backgrounds to #121212 to remove default dark-blue
const codeTheme = JSON.parse(JSON.stringify(oneDark))
function setAllBg(obj: Record<string, any>, val: string) {
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'background') obj[k] = val
    else if (typeof v === 'object' && v) setAllBg(v, val)
  }
}
setAllBg(codeTheme, '#1a1a1a')

// Persistent collapsed state for code blocks across remounts during streaming
const collapsedState = new Map<string, boolean>()
const calcTokens = (content: string, reasoning: string) =>
  (content + ' ' + reasoning).split(/\s+/).filter(Boolean).length

function RawHtmlBlock({ content, onSendToCanvas }: { content: string; onSendToCanvas?: (code: string) => void }) {
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)
  return (
    <div className="relative group" style={{ margin: '8px 0' }}>
      <div className="flex items-center justify-between px-3 py-1 rounded-t-md" style={{ backgroundColor: '#1a1a1a', borderBottom: collapsed ? 'none' : '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#666', display: 'flex', alignItems: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform .15s' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <span style={{ fontSize: 10, color: '#666' }}>html</span>
        </div>
        <div className="flex items-center gap-1">
          {onSendToCanvas && (
            <button onClick={() => { onSendToCanvas(content); setSent(true); setTimeout(() => setSent(false), 1500) }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] border-none cursor-pointer"
              style={{ backgroundColor: sent ? 'rgba(34,197,94,0.15)' : 'rgba(74,222,128,0.1)', color: sent ? '#22c55e' : '#4ade80', transition: 'all .15s' }}
            >+ {sent ? 'Sent' : 'Canvas'}</button>
          )}
          <button onClick={() => { navigator.clipboard.writeText(content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }) }}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] border-none cursor-pointer"
            style={{ backgroundColor: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: copied ? '#22c55e' : '#888', transition: 'all .15s' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="10" height="10" fill="currentColor"><path d="M480 400L288 400C279.2 400 272 392.8 272 384L272 128C272 119.2 279.2 112 288 112L421.5 112C425.7 112 429.8 113.7 432.8 116.7L491.3 175.2C494.3 178.2 496 182.3 496 186.5L496 384C496 392.8 488.8 400 480 400zM288 448L480 448C515.3 448 544 419.3 544 384L544 186.5C544 169.5 537.3 153.2 525.3 141.2L466.7 82.7C454.7 70.7 438.5 64 421.5 64L288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L368 496L368 512C368 520.8 360.8 528 352 528L160 528C151.2 528 144 520.8 144 512L144 256C144 247.2 151.2 240 160 240L176 240L176 192L160 192z"/></svg>
            {copied ? 'Done' : 'Copy'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <SyntaxHighlighter language="html" style={codeTheme} customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, fontSize: 10, lineHeight: 1.5, background: '#1a1a1a', maxHeight: 400, overflow: 'auto' }} PreTag="div">
          {content}
        </SyntaxHighlighter>
      )}
    </div>
  )
}

function CodeBlock({ className, children, onSendToCanvas }: { className?: string; children?: React.ReactNode; onSendToCanvas?: (code: string) => void }) {
  const match = /language-(\w+)/.exec(className || '')
  const code = String(children).replace(/\n$/, '')
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)
  // Use code content as stable key for collapsed state across remounts
  const stateKey = code.substring(0, 80)
  if (!collapsedState.has(stateKey)) collapsedState.set(stateKey, false)
  const [collapsed, setCollapsed] = useState(() => collapsedState.get(stateKey)!)
  const toggleCollapsed = () => { const next = !collapsed; collapsedState.set(stateKey, next); setCollapsed(next) }
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }
  if (match) {
    return (
      <div className="relative group" style={{ margin: '8px 0' }}>
        <div className="flex items-center justify-between px-3 py-1 rounded-t-md" style={{ backgroundColor: '#1a1a1a', borderBottom: collapsed ? 'none' : '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-2">
            <button onClick={toggleCollapsed} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#666', display: 'flex', alignItems: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform .15s' }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            <span style={{ fontSize: 10, color: '#666' }}>{match[1]}</span>
          </div>
          <div className="flex items-center gap-1">
            {onSendToCanvas && (
              <button onClick={() => { onSendToCanvas(code); setSent(true); setTimeout(() => setSent(false), 1500) }}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] border-none cursor-pointer"
                style={{ backgroundColor: sent ? 'rgba(34,197,94,0.15)' : 'rgba(74,222,128,0.1)', color: sent ? '#22c55e' : '#4ade80', transition: 'all .15s' }}
              >+ {sent ? 'Sent' : 'Canvas'}</button>
            )}
            <button onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] border-none cursor-pointer"
              style={{ backgroundColor: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: copied ? '#22c55e' : '#888', transition: 'all .15s' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="10" height="10" fill="currentColor"><path d="M480 400L288 400C279.2 400 272 392.8 272 384L272 128C272 119.2 279.2 112 288 112L421.5 112C425.7 112 429.8 113.7 432.8 116.7L491.3 175.2C494.3 178.2 496 182.3 496 186.5L496 384C496 392.8 488.8 400 480 400zM288 448L480 448C515.3 448 544 419.3 544 384L544 186.5C544 169.5 537.3 153.2 525.3 141.2L466.7 82.7C454.7 70.7 438.5 64 421.5 64L288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L368 496L368 512C368 520.8 360.8 528 352 528L160 528C151.2 528 144 520.8 144 512L144 256C144 247.2 151.2 240 160 240L176 240L176 192L160 192z"/></svg>
              {copied ? 'Done' : 'Copy'}
            </button>
          </div>
        </div>
          {!collapsed && (
            <SyntaxHighlighter language={match[1]} style={codeTheme} customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, fontSize: 10, lineHeight: 1.5, background: '#1a1a1a' }} PreTag="div">
              {code}
            </SyntaxHighlighter>
          )}
      </div>
    )
  }
  return <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#f093fb' }}>{children}</code>
}

const AI_CATEGORY_PROMPTS: Record<string, string> = {
  backgrounds: 'Extract background component specs: apply background design, style, color, linear/radial gradients, and patterns into the global stylesheet.',
  buttons: 'Extract button component specs: apply custom styling, hover/active interaction states, padding, layout dimensions, and border-radius.',
  cards: 'Extract card component specs: structure layout, inner paddings, custom box-shadows, borders, and glassmorphism properties.',
  navigation: 'Extract navbar component specs: layout alignment, nav-links styling, active state indicators, and responsive collapse breakpoints.',
  bars: 'Extract and transform this progress bar component into a standalone, production-ready Navigation Bar. Discard ALL original markup logic: .bar, .bar-fill, .bar-label, percentage widths, progress indicators. Use the colors, gradients, border-radius, and font ONLY as a design palette. Build a semantic navbar with <a> links and branding from scratch. Output as a centered preview.',
  typography: 'Extract typography specs: parse font-family, exact sizing, weights, line-heights, color, and alignment rules.',
  inputs: 'Extract input field specs: styling, border, focus/error states, placeholder design, sizing, and label positioning.',
  layout: 'Extract container specs: layout type (flex/grid), width, max-width, padding, margin, and responsive breakpoints.',
  media: 'Extract image/media specs: sizing, object-fit, border-radius, responsive behavior, and caption styling.',
  skeletons: 'Extract skeleton/loading specs: animation, shape proportions, shimmer color, and responsive sizing.',
  feedback: 'Extract feedback component specs: alert styling, color coding, icon placement, dismiss behavior, and animation.',
  status: 'Extract status indicator specs: badge styling, color scheme, positioning, and animation states.',
  tabs: 'Extract tab component specs: tab layout, active indicator, hover states, content panel spacing, and responsive scroll.',
  grids: 'Extract grid layout specs: column count, gap spacing, responsive breakpoints, and item alignment.',
  glass: 'Extract glassmorphism specs: backdrop blur, transparency, border highlights, and shadow depth.',
  'color palettes': 'Extract color palette specs: color values, usage roles, contrast ratios, and gradient combinations.',
  dashboard: 'Extract dashboard layout specs: widget grid, card spacing, header layout, and data visualization containers.',
  data: 'Extract data display specs: table/chart styling, header formatting, row alternation, and responsive overflow.',
  code: 'Extract code block specs: syntax theme, font family, line numbers, copy button styling, and scroll behavior.',
  switches: 'Extract switch/toggle specs: track styling, thumb design, checked state color, and animation.',
}

const BUILD_INSTRUCTIONS: Record<string, string> = {
  navigation: 'Semantic <nav> with <a> links, branding, active state using palette gradient',
  buttons: '3 variants: primary (palette gradient), secondary (outline), ghost',
  cards: 'Card with header, body, footer using palette colors',
  dashboard: 'Grid layout with metric cards and one chart area using palette',
  tabs: 'Tab bar with active state using palette accent color',
  inputs: 'Input field, textarea, select — styled with palette',
  feedback: 'Alert/toast variants: success, warning, error using palette tints',
  status: 'Badge/chip set using palette colors',
  switches: 'Toggle switch using palette gradient for active state',
  skeletons: 'Animated skeleton loader using palette muted colors',
  glass: 'Glassmorphism card with backdrop-filter using palette tints',
  grids: 'Responsive CSS grid layout using palette backgrounds',
  typography: 'Type scale showcase using palette colors',
  media: 'Image card / video player UI using palette',
  code: 'Syntax-highlighted code block using palette dark background',
  data: 'Table or data list with palette header and row colors',
  layout: 'Page layout with sidebar and content area using palette',
  bars: 'Progress bar component using palette colors',
  backgrounds: 'Background section using palette gradients and patterns',
  'color palettes': 'Color swatch showcase using palette colors',
  'my imports': 'Analyze the full HTML file, extract its visual identity into CSS variables, and build the target component from scratch using that palette.',
}

const AI_ACTIONS = [
  { id: 'extract', label: 'Extract Code' },
  { id: 'improve', label: 'Improve Design' },
  { id: 'create', label: 'Create Design' },
  { id: 'describe', label: 'Describe Component' },
  { id: 'clean', label: 'Clean Code' },
  { id: 'ask', label: 'Ask Anything...' },
  { id: 'game', label: 'Create Game' },
  { id: 'compile', label: 'Connected Components' },
]

const GEN_ACTIONS = [
  { id: 'backgrounds', label: 'Backgrounds' },
  { id: 'bars', label: 'Bars' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'cards', label: 'Cards' },
  { id: 'color-palettes', label: 'Color Palettes' },
  { id: 'glass', label: 'Glass' },
  { id: 'grids', label: 'Grids' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'layout', label: 'Layout' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'skeletons', label: 'Skeletons' },
  { id: 'status', label: 'Status' },
  { id: 'switches', label: 'Switches' },
  { id: 'tabs', label: 'Tabs' },
  { id: 'ask', label: 'Ask Anything...' },
]

const GEN_PROMPTS: Record<string, string> = {
  backgrounds: `Extract the global background, gradients, and overlays. Return a full HTML5 file. Extract colors into CSS :root variables. Set body to display:flex; justify-content:center; align-items:center; min-height:100vh; background:[extracted background]. Inside body, include a simple empty card with a subtle border to visually showcase the background depth. Do not minify.`,
  bars: `Extract the header/top bar component. Return a full HTML5 file. Extract colors into CSS :root variables. Wrap the component in a full-width container. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111. Output a clean semantic structure with readable, beautiful layout and proper padding. Do not minify.`,
  buttons: `Extract ONLY the button elements. Return a full HTML5 file. Extract layout/colors into CSS :root variables. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111. Wrap the buttons inside a styled flex container to preview primary, secondary, and gradient states with clear hover/active effects. Output beautifully formatted CSS, do not minify.`,
  cards: `Extract the card component. Return a full HTML5 file. Extract typography, padding, and colors into CSS :root variables. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111. Output a beautifully designed standalone card container with generic placeholder text. Do not minify.`,
  'color-palettes': `Extract the design system color palette. Return a full HTML5 file. Define all colors, gradients, and text variables inside CSS :root. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111; flex-wrap:wrap. Inside body, generate visual HTML grid blocks (color swatches) labeled with the variable names so I can preview the entire palette instantly. Do not minify.`,
  glass: `Extract the glassmorphic styling parameters. Return a full HTML5 file. Extract variables for blur, border color, and transparent background into CSS :root. Body must have a colorful gradient background and display:flex; justify-content:center; align-items:center; min-height:100vh. Put a centered container inside body applying the glass backdrop-filter effect to visually see the translucent look. Do not minify.`,
  grids: `Extract the functional grid layout system. Return a full HTML5 file. Define columns, gaps, and responsive breakouts in CSS rules. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111. Inside body, build a clean grid container containing basic styled boxes to visually preview the responsiveness and structure. Do not minify.`,
  inputs: `Extract form elements and inputs. Return a full HTML5 file. Put focus borders, shadows, and text colors into CSS :root variables. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111. Render a clean standalone input box or text area wrapper inside body with active focus states for visual preview. Do not minify.`,
  layout: `Extract the structural shell layout. Return a full HTML5 file. Extract wrapper bounds, margins, and section flex setups into CSS. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111. Include standard semantic blocks (main, section, container) containing minimal visible outlines for clean structure testing. Do not minify.`,
  navigation: `Extract the main navigation menu or sidebar system. Return a full HTML5 file. Put link tokens and hover behaviors into CSS :root variables. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111. Rebuild the semantic nav structure with items centered on screen to preview active, normal, and responsive states clearly. Do not minify.`,
  skeletons: `Extract the placeholder skeleton loading states. Return a full HTML5 file. Define the pulsing animation keyframes and background card bones in CSS. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111. Output isolated skeleton divs mimicking content structures to visually see the glow/pulse effect. Do not minify.`,
  status: `Extract indicators, badges, and status elements. Return a full HTML5 file. Define state colors (success, danger, alert) inside CSS :root variables. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111. Output small spans or tag blocks displaying the indicators with proper centering and padding. Do not minify.`,
  switches: `Extract the form toggle switch component. Return a full HTML5 file. Map track colors, handle sizes, and animations into CSS variables. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111. Render a semantic checkbox checkbox-wrapper transformed beautifully into the isolated UI switch. Do not minify.`,
  tabs: `Extract the tab navigation switch component. Return a full HTML5 file. Store selected indicator lines, active background, and text colors in CSS :root. Body must be display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111. Output a modular ul/li tab block structure to preview the static design properly. Do not minify.`,
}

const GAME_SYSTEM_PROMPT = `You are "Game Architect AI", a professional game developer specialized in building complete, fully playable games contained entirely within ONE SINGLE HTML FILE — HTML, CSS, and JavaScript all combined in that same file. No external files, no separate assets, no build process. External libraries are only allowed via a CDN link when absolutely necessary (e.g. Three.js for 3D).

CRITICAL RULE: The final deliverable must ALWAYS be exactly one (1) self-contained .html file that runs immediately when opened in a browser, with zero setup, zero server, and zero missing dependencies.

Your goal: turn any user request into a real, playable, bug-free, smooth, and fun game.

=====================================================
PHASE 1 — Decide Autonomously, Never Ask Questions
=====================================================
NEVER ask the user clarifying questions, under any circumstance. Do not stop to request more details, do not present multiple-choice options, and do not delay generation while waiting for a reply. The user will not answer follow-up questions — you must design and deliver the complete, best-possible game in a single response, immediately.

Whatever details the user provides in their request must be followed precisely. For anything the user did NOT specify, YOU decide — silently and confidently — using professional game-design judgment and the following default logic:

1. Game type (2D/3D): if not specified, default to 2D unless the request's theme clearly implies 3D (e.g. "first-person shooter", "3D racing", "explore a world").
2. Perspective (FPP/TPP/top-down/side-scroll): infer from genre. Shooters/exploration → FPP or TPP as fits the theme. Platformers → side view. Top-down shooters/arena games → top-down. Racing → TPP or top-down. Choose whichever perspective best fits how that genre is normally played and best showcases the request.
3. Gameplay genre: if vague ("make me a fun game"), choose a genre that is simple to implement flawlessly, inherently fun, and showcases smooth mechanics well (e.g. an endless runner, a dodge/survival arena, or a physics-based platformer) rather than something overly ambitious that risks bugs.
4. Controls: implement keyboard AND mouse by default for desktop play, and automatically add on-screen touch controls (virtual joystick / tap buttons) as well, so the game works well on both desktop and mobile without being asked.
5. Score/levels/enemies/win-lose conditions: always include a scoring or progress system and a clear win/lose or game-over condition — a game with no goal or feedback loop is not acceptable, even if the user didn't mention it.
6. Visual style: default to a clean, modern, minimal aesthetic — simple geometric shapes, a cohesive color palette, subtle gradients/shadows, and smooth animations — unless the user's request implies a specific style (pixel art, retro, realistic, etc.).
7. Platform support: always make it playable on both desktop and mobile by default.

Treat every one of these defaults as your professional judgment call, not a guess to double-check with the user. Move straight to building.

=====================================================
PHASE 2 — Apply Movement Type and Perspective Rules
=====================================================
Based on the type and perspective you decided on in Phase 1, apply the matching technical rules:

▸ 2D Game (platformer / top-down action / side-scrolling):
  - Use the Canvas 2D API (or DOM+CSS if more appropriate for the specific game).
  - Movement must be velocity/acceleration-based (not direct position snapping) to guarantee smooth motion.
  - If it's a platformer: implement gravity + jump velocity + proper ground/collision checks.

▸ 3D Game (using Three.js via CDN when needed):
  - Clearly implement the requested perspective:
    • FPP (First Person): the camera IS the player's eyes; use pointer lock for mouse look + WASD for movement.
    • TPP (Third Person): the camera follows the character from behind/side with smooth camera-follow logic (lerp/damping); the character model is visible and rotates to face its movement direction.
  - Always use Delta Time so movement speed stays consistent regardless of frame rate (FPS).
  - Implement simple but effective collision detection (bounding box or raycasting depending on the case).

=====================================================
PHASE 3 — Core Coding Rules (Mandatory for Every Game)
=====================================================
1. **Game Loop:** always use requestAnimationFrame — never setInterval for core game movement.
2. **Delta Time:** calculate the time difference between frames so the game runs at the same effective speed on every device/FPS.
3. **Game States:** implement clear states — Menu / Playing / Paused / Game Over / Win — with simple UI to transition between them (Start, Restart, Resume buttons).
4. **Input Handling:**
   - Use keydown/keyup to update a persistent keys state object instead of checking directly inside the event, so holding a key produces smooth continuous movement.
   - Automatically add touch event support if the game targets mobile or cross-platform play.
5. **Responsiveness:** make the Canvas adapt to screen size (resize listener), and use relative units where possible.
6. **Performance:**
   - Avoid creating new objects every frame inside the game loop (use object pooling for things like bullets or particles when there are many of them).
   - Clean up off-screen or dead entities from memory (array filtering).
7. **Collision Detection:** implement it precisely (AABB for 2D, bounding box/sphere for 3D) and avoid false positives that break the gameplay feel.
8. **Sound (optional but recommended):** add simple sound effects via the Web Audio API or embedded sound if the user asks for it, with a mute option.
9. **Zero Bugs:**
   - The code must have zero console errors.
   - Handle edge cases: going out of screen bounds, division by zero, multiple simultaneous collisions in the same frame, multiple keys pressed at once.
   - Logically verify every win/lose/start condition before delivering the code.
10. **Instant Playability:** the resulting file must run the moment it's opened in a browser, with no setup and no server — unless a CDN library is required, in which case state that clearly.
11. **Code Comments:** add short comments marking each major section (variables, game loop, collisions, controls, rendering) to make future edits easy.
12. **Balance and Fun (Game Feel):**
    - Add visual/audio feedback for every meaningful interaction (points gained, a small shake on impact, color flash, a small effect on win/lose).
    - Make difficulty scale progressively instead of being flat or randomly unfair.
    - Avoid heavy or delayed controls (input lag) — response to input must feel instant.
13. **Screen Boundaries (Mandatory):** the player must NEVER be able to drift or fall permanently outside the playable area in an unhandled way. Always explicitly implement either horizontal clamping (keep the player within canvas bounds) or screen-wrap (exit one edge, reappear on the opposite edge) — pick whichever fits the genre, but never leave this unhandled.
14. **Audio Must Actually Play:** browsers suspend the AudioContext until a real user gesture happens. Always call \`audioCtx.resume()\` inside the very first user interaction handler (e.g. the "Start" button's click handler) so sound effects are guaranteed to be audible from the first frame, not silently broken.
15. **Natural Movement Feel (No Robotic Snapping):** never assign velocity directly and instantly on key press/release (e.g. \`vx = 9\` / \`vx = 0\`). Instead accelerate towards a target speed while a key is held, and decelerate with friction when released, so movement feels smooth and physical. Only skip this for genres that intentionally require snappy binary movement (e.g. classic retro platformers), and even then apply a small amount of easing.
16. **Visual Identity Over Generic Shapes:** the player and key elements must visibly reflect the requested theme instead of being a plain solid-colored rectangle. Even in a minimal art style, add simple distinguishing details: eyes or a mask shape, a direction-facing flip when moving left/right, an outline, or a small accessory that matches the theme (e.g. a "ninja" should read as a ninja silhouette, not an anonymous colored box).
17. **Juicy Feedback (Mandatory, Not Optional — Implement ALL Three):** you must implement all of the following concrete techniques, not just "some feedback":
    - Squash-and-stretch: briefly scale the player sprite (e.g. scaleY 0.7 / scaleX 1.3 for 2-3 frames) on landing, and stretch vertically on jump takeoff.
    - Particles: on landing (and on any impact/collision/score event), spawn a small burst of 4-8 short-lived particles (simple circles/rects with their own velocity and fade-out) — implement a minimal particle array with update/draw, do not skip this as "too complex".
    - Screen shake: on hard impacts or game-over, briefly offset the canvas rendering origin by a small random amount for a few frames, decaying to zero.
    A game missing any of these three is considered incomplete, not "good enough".
18. **Reachability Validation With Safety Margin:** whenever you procedurally generate platforms/obstacles, compute your max jump height as \`(jumpVelocity^2) / (2*gravity)\` and NEVER place vertical gaps closer to that theoretical maximum than a 40% safety margin (i.e. max allowed gap = maxJumpHeight * 0.6). A gap that only barely mathematically works is not acceptable — real play involves friction, imprecise timing, and horizontal drift, so always build in comfortable slack.
19. **Progressive Difficulty (Mandatory):** the game must visibly get harder as score/time increases — e.g. platforms shrink gradually, gaps widen slightly (while respecting rule 18's safety margin), obstacles/enemies are introduced after a score threshold, or speed increases. A game where every section feels identical from start to end is not acceptable.
20. **Clean Restart (No Full Page Reload):** the "Retry"/restart button must reset the game's internal state (score, player position, entity arrays) via a JS function call, never via \`location.reload()\`. A full reload breaks the AudioContext and any accumulated state unnecessarily.
21. **Theme Must Be Visually Unmistakable:** two eyes on a colored rectangle is NOT sufficient to convey a theme. For the specific theme requested (e.g. "ninja"), add at least 2-3 concrete recognizable visual cues drawn with basic shapes (e.g. for a ninja: a dark color scheme, a headband/mask shape across the eyes, a small cape or scarf trail, a weapon silhouette) so the character is identifiable at a glance without reading the title.

=====================================================
ADDITIONAL RULES — 3D / Open-World / Vehicle Games
(Apply These Whenever Relevant, In Addition To All Rules Above)
=====================================================
22. **World Collision (Mandatory for any game with solid scenery):** implement collision between the player/vehicle and every static solid object in the world (buildings, walls, terrain features, obstacles). The player must NEVER be able to pass through solid geometry. For performance with many objects, use a spatial partition (a simple grid is enough) so each frame you only test collisions against nearby objects, never the entire world's object list.
23. **Vehicle Physics Template (for driving/vehicle games):** implement acceleration, braking, and friction-based deceleration; steering that only takes effect while the vehicle is actually moving (never let it rotate in place at zero speed); scale down turn rate at high speed for stability; give reverse a separate, lower max speed than forward.
24. **Camera Collision (Mandatory for any 3rd-person/chase camera placed in a world with obstacles):** the follow-camera must never clip inside solid geometry. Raycast from the target toward the ideal camera position each frame; if the ray hits a solid object before reaching the ideal distance, pull the camera in to just before the hit point instead of letting it pass through walls/buildings.
25. **Performance at Scale (Mandatory for open-world/large maps):** never instantiate hundreds or thousands of individual \`Mesh\` objects for repeated elements (buildings, trees, props, etc.) — always use \`THREE.InstancedMesh\` (or equivalent batching) for any geometry that repeats many times. Use fog and/or distance-based culling to limit visual draw distance instead of rendering the entire map in full detail at all times. Disable or tightly limit shadow maps on very large scenes unless their range has been deliberately optimized — unoptimized shadows on a huge map will tank frame rate.
26. **Procedural Audio Instead of External Files (Mandatory — Single File Rule):** the game must remain ONE self-contained HTML file, so NEVER reference external audio/video/image files (e.g. \`<audio src="engine.mp3">\`, \`background.mp3\`, texture image files) — they will not exist on the user's machine and the game will silently fail. If the game needs engine hum, ambient drones, wind, or music, synthesize them with the Web Audio API (oscillators/noise + gain/filter nodes, modulated live by game state — e.g. engine pitch tied to speed) using the exact same approach as short sound effects. If a texture is needed, draw it procedurally on an in-memory \`<canvas>\` and use it as a \`CanvasTexture\`, exactly as shown for roads/windows — never load an external image path.
27. **World Boundaries (Mandatory even in "open world" games):** a world that feels open must still prevent the player from driving/walking forever into an empty, contentless void. Implement either an invisible boundary well beyond the visible play area, or loop/wrap the world edges, so the player is never permanently lost outside playable content.
28. **HUD and Mobile Controls for Vehicles/3D Games:** always include an on-screen status HUD relevant to the game (speed, health, ammo, etc. as appropriate). When the game could be played on a touch device, add on-screen controls (virtual joystick and/or directional buttons, throttle/brake buttons) in addition to keyboard/mouse, following the same "desktop + mobile by default" rule from Phase 1.

=====================================================
ADDITIONAL RULES — 3D Character Controller Games
(FPP & TPP, Non-Vehicle — Apply Whenever Relevant)
=====================================================
29. **FPP Mouse Look & Pointer Lock (Mandatory for any FPP game):** request pointer lock on the canvas on first click/start (\`element.requestPointerLock()\`); clamp vertical look (pitch) to roughly ±89° so the camera can never flip upside down; use a clear, tweakable mouse-sensitivity constant. Listen for the \`pointerlockchange\` event and show a small "click to resume" overlay if the lock is lost mid-game (e.g. the user pressed Escape), re-requesting the lock on the next click.
30. **Camera-Relative Movement (Mandatory for any 3D character, not just vehicles):** movement must be relative to the camera's horizontal (yaw) facing, never raw world axes — "forward" always means "the direction the camera/character is currently facing along the ground plane", ignoring camera pitch so looking up/down never speeds up, slows down, or redirects walking. Diagonal movement (e.g. W+D held together) must be vector-normalized so it is not faster than single-direction movement.
31. **Jump & Gravity for 3D Characters (FPP/TPP, non-vehicle):** apply constant gravity to a vertical velocity every frame; use a ground check (downward raycast or Y-position + collision test) to know when the character is grounded and allowed to jump; apply a clear jump impulse on input. Never allow infinite mid-air jumps unless the user explicitly requested double/triple jump.
32. **TPP Character Rotation:** the visible character model must smoothly rotate (lerp/slerp, never snap instantly) to face its current movement direction, so it never appears to slide sideways or backwards unnaturally while moving.
33. **Mobile Controls for FPP/TPP (Dual Input Required):** a single virtual joystick is NOT enough for first/third-person 3D games, since the player needs to move AND look independently. Implement two separate touch zones: a virtual joystick on one side of the screen for movement, and a drag-to-look touch area on the other side for camera rotation, plus a dedicated jump button.
34. **Combat/Interaction Basics (only when the requested genre implies it, e.g. "shooter"):** implement a simple raycast from the camera center for hit detection, a visible crosshair, and basic visual feedback on a successful hit (flash, particle burst). Never leave an explicitly requested shooting/interaction mechanic completely unimplemented.

=====================================================
ADDITIONAL RULES — Power-Ups & "Power Mods"
(Trigger whenever the user's request mentions: power, power-up, power mod, boost, or "style power")
=====================================================
35. **What a Power-Up Is:** a power-up (also called a "power mod", "buff", or "pickup") is a collectible item placed in the game world that, when the player touches/collects it, temporarily (or sometimes permanently) changes the player's stats or abilities. Whenever the user's request mentions "power", "power-up", "power mod", "boost", or "style power", you must implement a REAL power-up system that actually affects gameplay — never just a passive decoration with no mechanical effect.
36. **Choose Concrete Power-Up Types (Pick 2-4 That Fit the Genre):** implement power-ups that genuinely change gameplay, for example: Speed Boost (temporarily higher move speed), Strength/Power Boost (bigger or stronger attacks, more damage, bigger player size, or higher jump), Precision Boost (bigger hitbox for the player's attacks, or auto-aim assist), Shield/Invincibility (temporary immunity to damage/obstacles/collisions), Score Multiplier, Extra/Double Jump, Magnet (auto-pulls nearby collectibles toward the player). Give each a clear, limited duration (roughly 5-10 seconds) shown on a HUD timer, unless the genre calls for a one-time permanent unlock instead.
37. **The Power "Aura/Glow" Visual Effect (this is precisely what "style power" means):** while a power-up is active, the player sprite/model must visibly look different so its powered-up state is obvious at a glance. Implement ALL of the following techniques together, not just one:
    - **Glow/halo aura:** draw a soft, semi-transparent glowing shape directly behind or around the player — in 2D Canvas use \`ctx.shadowBlur\` + \`ctx.shadowColor\` plus a larger translucent circle/ring behind the sprite; in Three.js use an emissive material glow or a soft additive-blended sprite/ring behind the model.
    - **Pulse/fade animation (this is the "fast fade movement" the user is describing):** animate that glow's opacity and/or size rhythmically up and down using something like \`opacity = 0.5 + 0.5 * Math.sin(time * 8)\`, so it visibly brightens and dims in a fast, repeating pulse instead of staying static — this rapid breathing/flashing motion is what reads as "powered up" to a player.
    - **Motion trail:** while empowered, leave a short trail of fading afterimages or particles behind the player as it moves — store the last several player positions each frame and redraw faded, shrinking copies of the sprite at each one (or emit a steady stream of small fading particles along the movement path).
    - **Color shift:** briefly recolor or tint the player sprite itself (e.g. shift toward a bright gold, electric blue, or white-hot color) for the duration, so the powered-up state still reads clearly even at a glance without the glow.
38. **Activation & Expiry Feedback:** play a distinct rising-pitch sound plus a small particle burst at the exact moment of pickup/activation. When the power-up is close to expiring (its final ~20% of duration), make the glow/HUD icon blink noticeably faster as an early warning; play a short descending-pitch sound and cleanly remove all the visual effects the instant it ends.
39. **HUD Indicator (Mandatory Whenever a Power-Up Is Timed):** always show a small icon plus a shrinking timer bar (linear or radial) on screen while any timed power-up is active, so the player always knows exactly what is active and how much time remains.

=====================================================
PHASE 4 — Self-Check Before Delivery (Mandatory)
=====================================================
Before outputting the final code, mentally simulate playing the game and verify ALL of the following are true. If any fail, fix the code before delivering:
- [ ] The player can never permanently leave the screen or get stuck outside the playable area.
- [ ] Sound effects will actually be audible (AudioContext is resumed on the first interaction).
- [ ] Movement has acceleration/friction and does not feel robotic or instant, unless the genre explicitly calls for snappy controls.
- [ ] The player/main character has 2-3 concrete visual cues that make the requested theme instantly recognizable — not just generic eyes on a rectangle.
- [ ] ALL THREE juice techniques are implemented: squash-and-stretch, particle bursts, and screen shake — not just one of them.
- [ ] Every procedurally generated gap/obstacle respects a 40% safety margin below the theoretical max jump height/distance.
- [ ] Difficulty visibly increases over time (shrinking platforms, more obstacles, increasing speed, or similar).
- [ ] Restart/retry resets game state via a JS function — it never uses \`location.reload()\`.
- [ ] There are zero console errors and no unhandled edge cases (out-of-bounds, division by zero, simultaneous key presses, multiple simultaneous collisions).
- [ ] (3D/vehicle/open-world games only) The player/vehicle cannot pass through any solid world geometry — collision against buildings/walls/obstacles is implemented.
- [ ] (3D games with a chase/follow camera) The camera raycasts against the world and pulls in when obstructed — it never clips through solid objects.
- [ ] (Open-world/large maps) Repeated geometry (buildings, trees, props) uses InstancedMesh, not thousands of individual Mesh objects.
- [ ] There is no \`<audio src="...">\`, no external image src/texture path, and no other reference to a file that won't exist on the user's machine — all audio and textures are generated procedurally in-code.
- [ ] The world has a boundary or wrap so the player can never drive/walk into an endless, empty, unplayable void.
- [ ] (FPP games) Pointer lock is requested on start, pitch is clamped (~±89°), and losing/regaining lock (Escape key) is handled gracefully.
- [ ] (Any 3D character, FPP or TPP) Movement direction is camera-relative (yaw-based) and diagonal movement is normalized — not raw world-axis movement.
- [ ] (3D character games) Jump/gravity uses a proper ground check — no infinite mid-air jumping unless explicitly requested.
- [ ] (Touch devices, FPP/TPP) Two independent touch controls exist — one for movement, one for looking — not a single joystick trying to do both.
- [ ] (If the user mentioned power/power-up/power mod/boost) The power-up actually changes gameplay stats (speed, strength, precision, etc.) with a clear limited duration — it is not just decorative.
- [ ] (Whenever a power-up is active) The player shows a pulsing glow/aura, a motion trail, AND a color shift together — not just one of the three — plus a HUD timer indicating remaining duration.

=====================================================
PHASE 5 — Delivery
=====================================================
- Deliver the game as ONE single, complete, ready-to-copy-paste HTML file. Never split it into multiple files.
- After the code, write a short summary: controls, the game's objective, and any extra features you added.
- If the user later asks for changes, apply them directly on top of the same code structure without rewriting everything from scratch, unless the change is truly fundamental.

Always remember: never ask the user anything — decide, design, and deliver the best possible complete game in one shot, filling every gap with confident, professional game-design defaults. Code quality and being bug-free matter more than anything else. And no matter what: the final output is always exactly one single HTML file.`

const AiMessageItem = memo(({ msg, onSendToCanvas, tokenCount }: { msg: AiMessage; onSendToCanvas?: (code: string) => void; tokenCount?: number }) => {
  const [showReasoning, setShowReasoning] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const trimmed = msg.content.trim()
  const isRawHtml = msg.role === 'assistant' && (trimmed.startsWith('<!DOCTYPE html>') || trimmed.startsWith('<html') || trimmed.startsWith('--- '))
  const showCollapse = !isRawHtml && msg.content.length > 200
  return (
    <div className="flex flex-col"
      style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>
      <div className={`ai-msg-bubble ${msg.role}`}>
        {msg.role === 'assistant' && msg.reasoning && (
          <div style={{ marginBottom: showCollapse && collapsed ? 0 : 8 }}>
            <div onClick={() => setShowReasoning(!showReasoning)}
              style={{ cursor: 'pointer', fontSize: 11, color: '#888', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ transform: showReasoning ? 'rotate(90deg)' : 'none', transition: 'transform .15s', fontSize: 9 }}>{'>'}</span>
              Reasoning
            </div>
            {showReasoning && (
              <div style={{ marginTop: 4, padding: '6px 8px', fontSize: 12, color: '#999', lineHeight: 1.5, background: '#1a1a1a', borderRadius: 6, borderLeft: '2px solid #f093fb' }}>
                {msg.reasoning}
              </div>
            )}
          </div>
        )}
        {isRawHtml ? (
          <RawHtmlBlock content={msg.content} onSendToCanvas={onSendToCanvas} />
        ) : (
          <>
            {showCollapse && (
              <div onClick={() => setCollapsed(!collapsed)}
                style={{ cursor: 'pointer', fontSize: 11, color: '#666', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: collapsed ? 0 : 6 }}>
                {collapsed ? '▶' : '▼'}
                <span style={{ fontSize: 10, marginLeft: 2 }}>{msg.role === 'user' ? 'You' : 'Text'} {collapsed ? `(${msg.content.length} chars)` : `(${msg.content.length} chars)`}</span>
              </div>
            )}
            {!collapsed && (
              <Markdown
                components={{
                  code: (props) => <CodeBlock {...props} onSendToCanvas={msg.role === 'assistant' ? onSendToCanvas : undefined} />,
                  p: ({ children }) => <p style={{ margin: '4px 0', lineHeight: 1.6 }}>{children}</p>,
                  ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ol>,
                  li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                  strong: ({ children }) => <strong style={{ color: '#e0e0e0' }}>{children}</strong>,
                  a: ({ href, children }) => <a href={href} style={{ color: '#667eea' }} target="_blank" rel="noreferrer">{children}</a>,
                }}
              >{msg.content}</Markdown>
            )}
          </>
        )}
      </div>
      <span className="ai-timestamp" style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}>
        {msg.role === 'user' ? 'You' : 'AI'} · {new Date(msg.createdAt).toLocaleTimeString()}{tokenCount !== undefined ? ` · +${tokenCount.toLocaleString()} tokens` : ''}
      </span>
    </div>
  )
}, (prev, next) => prev.msg.content === next.msg.content && prev.msg.reasoning === next.msg.reasoning && prev.tokenCount === next.tokenCount)

const AiMessageList = memo(({ messages, onSendToCanvas, messageTokenCounts }: { messages: AiMessage[]; onSendToCanvas: (code: string) => void; messageTokenCounts: Map<string, number> }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {messages.map(msg => (
        <AiMessageItem key={msg.id} msg={msg} onSendToCanvas={msg.role === 'assistant' ? onSendToCanvas : undefined} tokenCount={messageTokenCounts.get(msg.id)} />
      ))}
    </div>
  )
})

function GenerateWindow() {
  const [activeTab, setActiveTab] = useState<'generate' | 'ai' | 'quick'>('generate')
  const [panelWidth, setPanelWidth] = useState(340)
  const resizeRef = useRef(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>('')

  const canvasElements = useAppStore((s) => s.canvasElements)
  const connections = useAppStore((s) => s.connections)
  const selectedElementId = useAppStore((s) => s.selectedElementId)
  const canvasMode = useAppStore((s) => s.canvasMode)
  const triggerGenerate = useAppStore((s) => s.triggerGenerate)
  const setTriggerGenerate = useAppStore((s) => s.setTriggerGenerate)
  const aiMessages = useAppStore(s => s.aiMessages)
  const addAiMessage = useAppStore(s => s.addAiMessage)
  const updateAiMessageContent = useAppStore(s => s.updateAiMessageContent)
  const updateAiMessageReasoning = useAppStore(s => s.updateAiMessageReasoning)
  const clearAiMessages = useAppStore(s => s.clearAiMessages)
  const aiConnections = useAppStore(s => s.aiConnections)
  const aiTargetNodes = useAppStore(s => s.aiTargetNodes)

  const [output, setOutput] = useState('')
  const [liveText, setLiveText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textRef = useRef('')
  const charsRef = useRef<string[]>([])
  const indexRef = useRef(0)
  const [genAiInput, setGenAiInput] = useState('')
  const [genAiLoading, setGenAiLoading] = useState(false)
  const [genAiResult, setGenAiResult] = useState('')
  const genAbortRef = useRef<AbortController | null>(null)
  const genTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [genShowDropdown, setGenShowDropdown] = useState(false)
  const [genSelectedAction, setGenSelectedAction] = useState(GEN_ACTIONS[0])
  const genDropdownRef = useRef<HTMLDivElement>(null)

  const [aiInput, setAiInput] = useState('')
  const [aiIsGenerating, setAiIsGenerating] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedAction, setSelectedAction] = useState(AI_ACTIONS[0])
  const [targetActive, setTargetActive] = useState(false)
  const [dropdownDisabled, setDropdownDisabled] = useState(false)
  const [targetExpanded, setTargetExpanded] = useState(true)
  const [cleaning, setCleaning] = useState(false)

  const aiOutputRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const streamThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastUserMsgRef = useRef('')
  const lastAssistantIdRef = useRef<string | null>(null)
  const lastSystemPromptRef = useRef('')
  const tokenCountRef = useRef(0)
  const [tokenCount, setTokenCount] = useState(0)
  const messageTokenCounts = useRef<Map<string, number>>(new Map())
  const [userScrolledUp, setUserScrolledUp] = useState(false)
  const isQuickGenRef = useRef(false)
  const quickGenCategoryRef = useRef<string | undefined>(undefined)
  const [quickUnviewedCount, setQuickUnviewedCount] = useState(0)
  const quickResults = useAppStore(s => s.quickResults)
  const addQuickResult = useAppStore(s => s.addQuickResult)
  const removeQuickResult = useAppStore(s => s.removeQuickResult)

  const connectedElements = useMemo(() =>
    findConnectedGraph(canvasElements, connections, selectedElementId),
    [canvasElements, connections, selectedElementId]
  )

  const apiSettings = useAppStore(s => s.apiSettings)
  const getApiConfig = useCallback(() => {
    const { provider, baseUrl, model, apiKey } = apiSettings
    let url = ''
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
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
    return { url, headers, model, provider }
  }, [apiSettings])

  const buildApiBody = useCallback((messages: { role: string; content: string }[], maxTokens: number, isGemini = false) => {
    if (isGemini) {
      const contents: { role: string; parts: { text: string }[] }[] = []
      for (const m of messages) {
        if (m.role === 'system') {
          contents.push({ role: 'user', parts: [{ text: `System instruction: ${m.content}` }] })
        } else {
          contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })
        }
      }
      return JSON.stringify({ contents, generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens } })
    }
    const bodyObj: any = { model: apiSettings.model, messages, stream: true, temperature: 0.3, max_tokens: maxTokens }
    if (apiSettings.provider === 'llama' && apiSettings.disableReasoning) {
      bodyObj.stop = ["<think>"]
    }
    return JSON.stringify(bodyObj)
  }, [apiSettings.model, apiSettings.provider, apiSettings.disableReasoning])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      abortRef.current?.abort()
      if (streamThrottleRef.current) clearTimeout(streamThrottleRef.current)
    }
  }, [])

  const startGenerate = useCallback(() => {
    if (canvasElements.length === 0 || connectedElements.length === 0) {
      setOutput('/* No connected nodes found. Connect nodes on the canvas first. */')
      return
    }

    let fullText = ''

    if (canvasMode === 'source') {
      fullText = connectedElements
        .map((el) =>
          `/* ===== ${el.name} (${el.type}) ===== */\n\n${el.css}\n\n${el.html}\n`
        )
        .join('\n')
    } else {
      const lines: string[] = [
        `Connected components: ${connectedElements.length}`,
        '', '---', '',
      ]
      connectedElements.forEach((el) => {
        lines.push(
          `${el.name}`,
          '',
          `Type: ${el.type}`,
          `Category: ${el.category}`,
          `Description: ${el.description || 'No description'}`,
          `Position: X=${Math.round(el.x)}, Y=${Math.round(el.y)}`,
          `Size: ${el.width}x${el.height}`,
          '',
          '---',
          '',
        )
      })
      fullText = lines.join('\n')
    }

    textRef.current = ''
    charsRef.current = fullText.split('')
    indexRef.current = 0
    setIsGenerating(true)
    setProgress(0)
    setLiveText('')
    setOutput('')

    const chunkSize = Math.max(1, Math.floor(charsRef.current.length / 60))

    intervalRef.current = setInterval(() => {
      const chars = charsRef.current
      const end = Math.min(indexRef.current + chunkSize, chars.length)
      const chunk = chars.slice(indexRef.current, end).join('')
      textRef.current += chunk
      indexRef.current = end
      setLiveText(textRef.current)
      setProgress(Math.round((indexRef.current / chars.length) * 100))

      if (indexRef.current >= chars.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setOutput(textRef.current)
        setLiveText('')
        setIsGenerating(false)
        setProgress(100)
      }
    }, 40)
  }, [canvasElements.length, connectedElements, canvasMode])

  // React to triggerGenerate from store
  useEffect(() => {
    if (triggerGenerate && canvasElements.length > 0 && connectedElements.length > 0) {
      setTriggerGenerate(false)
      startGenerate()
    }
  }, [triggerGenerate, canvasElements.length, connectedElements.length, startGenerate])

  // Clear output when canvas mode changes so stale content doesn't persist
  useEffect(() => {
    setOutput('')
    setLiveText('')
    setIsGenerating(false)
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [canvasMode])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const handleGenerate = () => {
    if (isGenerating) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setIsGenerating(false)
      setLiveText('')
      return
    }
    startGenerate()
  }

  const handleGenAiSend = useCallback(async () => {
    const prompt = genAiInput.trim()
    const isAsk = genSelectedAction.id === 'ask'
    if ((isAsk && !prompt) || !output) return
      setGenAiLoading(true)
      setGenAiResult('')
      setGenAiInput('')
      genAbortRef.current?.abort()
      genAbortRef.current = new AbortController()

    const actionDesc = isAsk ? prompt : GEN_PROMPTS[genSelectedAction.id] || `Design a ${genSelectedAction.label} component`
    const userMsg = isAsk
      ? `Current content:\n\n${output}\n\nUser request: ${prompt}`
      : `Current content:\n\n${output}\n\nTask: ${actionDesc}`

    try {
      const { url, headers, provider } = getApiConfig()
      const msgs = [
        { role: 'system', content: 'You are a strict UI extraction engine. STRICT RULES: 1) No minification — output raw, readable, well-formatted CSS/HTML. 2) Component isolation — output ONLY the requested component. Do NOT mix different component types (e.g. do not include buttons when asked for palettes). 3) Return a full HTML5 file with colors in CSS :root variables. 4) Do not wrap output in markdown fences or code blocks. 5) No explanations or commentary — output the HTML file directly.' },
        { role: 'user', content: userMsg },
      ]
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: buildApiBody(msgs, 4096, provider === 'gemini'),
        signal: genAbortRef.current.signal,
      })
      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
      let fullContent = ''
      if (provider === 'gemini') {
        const text = await res.text()
        try {
          const parsed = JSON.parse(text)
          fullContent = parsed.candidates?.map((c: any) => c.content?.parts?.map((p: any) => p.text).join('')).join('') || '(empty)'
        } catch { fullContent = `Parse error: ${text.slice(0, 200)}` }
        setGenAiResult(fullContent)
      } else {
        if (!res.body) throw new Error('No response body')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed === 'data: [DONE]') continue
            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6))
                const delta = parsed.choices?.[0]?.delta
                if (delta?.content) fullContent += delta.content
                setGenAiResult(fullContent)
              } catch { /* skip partial */ }
            }
          }
        }
        if (buffer && buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(buffer.slice(6))
            const delta = parsed.choices?.[0]?.delta
            if (delta?.content) fullContent += delta.content
          } catch { /* skip */ }
        }
        setGenAiResult(fullContent || '(empty response)')
      }
    } catch (err: any) {
      if (err.name === 'AbortError') { setGenAiResult(prev => prev + '\n\n*(Stopped)*'); return }
      setGenAiResult(`Error: ${err.message}`)
    }
    setGenAiLoading(false)
    genAbortRef.current = null
  }, [genAiInput, output, canvasMode, genSelectedAction.id, getApiConfig, buildApiBody])

  const sendGenToCanvas = useCallback(() => {
    const content = genAiResult
    if (!content) return
    const parts = content.split(/(?=--- )/).filter(Boolean)
    if (parts.length > 1) {
      parts.forEach((part, i) => {
        const nameMatch = part.match(/^--- (.+?) ---/)
        const name = nameMatch ? nameMatch[1].trim() : `Component ${i + 1}`
        let html = part.replace(/^--- .+? ---\s*/, '').trim()
        let css = ''
        const cssMatch = html.match(/```css\n([\s\S]*?)```/)
        if (cssMatch) css = cssMatch[1]
        const htmlMatch = html.match(/```html\n([\s\S]*?)```/)
        if (htmlMatch) html = htmlMatch[1]
        if (!htmlMatch) {
          const genericMatch = html.match(/```(?:\w*)\n([\s\S]*?)```/)
          if (genericMatch) html = genericMatch[1]
        }
        if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) return
        useAppStore.getState().addCanvasElement({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          componentId: 'gen-ai-' + i,
          x: 200 + Math.random() * 200 + i * 30, y: 200 + Math.random() * 200 + i * 30,
          width: 360, height: 240,
          name, category: genSelectedAction.label, type: 'component' as const,
          html, css, description: `Generated: ${name}`,
          source: 'ai' as const, mode: 'source' as const,
        })
      })
    } else {
      let html = content
      let css = ''
      const cssMatch = content.match(/```css\n([\s\S]*?)```/)
      if (cssMatch) css = cssMatch[1]
      const htmlMatch = content.match(/```html\n([\s\S]*?)```/)
      if (htmlMatch) html = htmlMatch[1]
      if (!htmlMatch) {
        const genericMatch = content.match(/```(?:\w*)\n([\s\S]*?)```/)
        if (genericMatch) html = genericMatch[1]
      }
      useAppStore.getState().addCanvasElement({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        componentId: 'gen-ai',
        x: 200 + Math.random() * 200, y: 200 + Math.random() * 200,
        width: 360, height: 240,
        name: genSelectedAction.label,
        category: genSelectedAction.id === 'ask' ? 'AI' : genSelectedAction.label,
        type: 'component' as const,
        html, css, description: `Generated: ${genSelectedAction.label}`,
        source: 'ai' as const, mode: 'source' as const,
      })
    }
    setGenAiResult('')
    setGenAiInput('')
  }, [genAiResult, genSelectedAction.label, genSelectedAction.id])

  // Track manual scroll position
  useEffect(() => {
    const el = aiOutputRef.current
    if (!el) return
    const onScroll = () => {
      setUserScrolledUp(el.scrollHeight - el.scrollTop - el.clientHeight > 60)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [aiMessages.length])

  // Auto-scroll when new content arrives if user was near bottom; also on generation start
  useEffect(() => {
    const el = aiOutputRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      el.scrollTop = el.scrollHeight
      setUserScrolledUp(false)
    }
  }, [aiMessages, aiIsGenerating])

  useEffect(() => {
    const cl = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
      if (genDropdownRef.current && !genDropdownRef.current.contains(e.target as Node)) setGenShowDropdown(false)
    }
    window.addEventListener('click', cl)
    return () => window.removeEventListener('click', cl)
  }, [])

  const quickGenerate = useAppStore(s => s.quickGenerate)
  const setQuickGenerate = useAppStore(s => s.setQuickGenerate)

  // Auto-send quick generate prompts
  useEffect(() => {
    if (quickGenerate) {
      isQuickGenRef.current = true
      quickGenCategoryRef.current = quickGenerate.category
      handleAiSend(quickGenerate.prompt)
      setQuickGenerate(null)
    }
  }, [quickGenerate])

  // Save quick result when AI finishes generating
  const prevGenerating = useRef(aiIsGenerating)
  useEffect(() => {
    if (prevGenerating.current && !aiIsGenerating && isQuickGenRef.current) {
      isQuickGenRef.current = false
      const msgs = useAppStore.getState().aiMessages
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content.trim()) {
        let html = lastMsg.content
        // Strip markdown fences
        const htmlMatch = html.match(/```html\n([\s\S]*?)```/)
        if (htmlMatch) html = htmlMatch[1]
        const codeMatch = html.match(/```\n([\s\S]*?)```/)
        if (!htmlMatch && codeMatch) html = codeMatch[1]
        const label = quickGenCategoryRef.current === 'whole-page' ? 'Whole Page' : (quickGenCategoryRef.current || 'Quick')
        addQuickResult({ html, category: quickGenCategoryRef.current, label })
        setQuickUnviewedCount(c => c + 1)
      }
      useAppStore.getState().setQuickLoading(false)
      quickGenCategoryRef.current = undefined
    }
    prevGenerating.current = aiIsGenerating
  }, [aiIsGenerating])

  const selectedEl = canvasElements.find(e => e.id === selectedElementId)
  const connectedEls = aiConnections.map(c => canvasElements.find(e => e.id === c.canvasElementId)).filter(Boolean)

  const handleAiSend = (overridePrompt?: string) => {
    const promptText = (overridePrompt ?? aiInput).trim()
    if (!promptText && !selectedEl && connectedEls.length === 0) return

    const contextParts: string[] = []
    const isCompileMode = targetActive

    // Deduplicate by element ID to avoid duplicate connections
    const allElsMap = new Map<string, NonNullable<typeof selectedEl>>()
    ;[selectedEl, ...connectedEls].filter((e): e is NonNullable<typeof selectedEl> => Boolean(e)).forEach(el => {
      if (!allElsMap.has(el.id)) allElsMap.set(el.id, el)
    })
    const allEls = Array.from(allElsMap.values())

    const actionLabel = isCompileMode ? 'Compile Connected Components' : selectedAction.label
    const componentNames = allEls.map(el => `"${el.name}" (${el.category})`).join(', ')

    let userMsg: string
    let systemPrompt: string

    // ---- Target Mode: Use AI Connections ----
    if (isCompileMode && aiConnections.length > 0) {
      // Build per-element connection map: canvasElementId → AiTargetNode[]
      const connMap = new Map<string, { element: NonNullable<typeof selectedEl>; targets: typeof aiTargetNodes }>()
      for (const conn of aiConnections) {
        const el = canvasElements.find(e => e.id === conn.canvasElementId)
        const node = aiTargetNodes.find(n => n.id === conn.aiTargetId)
        if (!el || !node) continue
        if (!connMap.has(el.id)) connMap.set(el.id, { element: el, targets: [] })
        connMap.get(el.id)!.targets.push(node)
      }

      if (connMap.size === 0) {
        systemPrompt = 'You are an expert web developer.'
        userMsg = promptText || 'Describe what you need.'
      } else {
        // Build context parts: one section per source element with its AI targets
        const allBuildEntries: { sourceName: string; sourceCat: string; targetName: string; targetCat: string }[] = []
        contextParts.push('CONNECTED COMPONENTS (Source → Target):')

        for (const [elId, { element, targets }] of connMap) {
          const isMyImport = element.category === 'My Imports'
          for (const target of targets) {
            allBuildEntries.push({ sourceName: element.name, sourceCat: element.category, targetName: target.label, targetCat: target.category })
          }
          contextParts.push(`\nSOURCE: ${element.name} (${element.category})`)
          contextParts.push(isMyImport
            ? `Full HTML:\n${element.html}`
            : `CSS:\n${element.css}\n\nHTML:\n${element.html}`)
          contextParts.push(`TARGETS: ${targets.map(t => t.label).join(', ')}`)
        }

        // Build dynamic task
        const uniqueTargetCats = [...new Set(allBuildEntries.map(e => e.targetCat))]
        const taskLine = `Output SEPARATE HTML files — one per Source→Target connection. Use each SOURCE's palette to build its corresponding TARGET component from scratch.`

        // Build example output showing each connection
        const exampleParts = allBuildEntries.map(e =>
          `--- ${e.sourceName}_${e.targetName} ---\n<!DOCTYPE html>\n<html>\n<head>...</head>\n<body>...${e.targetCat} built from ${e.sourceCat} palette...</body>\n</html>`)
        const exampleStr = exampleParts.join('\n\n')

        const buildLines = [...new Set(allBuildEntries.map(e => e.targetCat))]
          .map(cat => `  - ${cat}: ${BUILD_INSTRUCTIONS[cat.toLowerCase()] || 'Build a clean, minimal component using the source palette'}`)
          .join('\n')

        const compilerInstruction = `\n\nTASK: ${taskLine}\n\nCONNECTIONS (${allBuildEntries.length} total):\n${allBuildEntries.map((e, i) => `  ${i + 1}. "${e.sourceName}" (${e.sourceCat}) → build a "${e.targetName}" (${e.targetCat})`).join('\n')}\n\nSTRICT RULES:\n1. Output EXACTLY ${allBuildEntries.length} separate HTML files — one per connection.\n2. Separate each file with "--- <SourceName>_<TargetName> ---" on its own line before the HTML.\n3. Use the SOURCE's colors/gradients/fonts as design palette — extract them into CSS variables (:root)\n4. CSS must be inside a <style> tag in the <head>\n5. Body must be: display:flex; justify-content:center; align-items:center; min-height:100vh; background: [extracted palette background or #111]\n6. Build a semantic, production-ready ${uniqueTargetCats.join(', ')} component from scratch using the source's palette\n7. Discard ALL original markup logic from the source — do not copy class names, structure, or component logic\n8. NO raw hex color codes or CSS values as visible HTML text\n9. Clean, minimal, beautiful — copy-paste ready. Include * { box-sizing: border-box; margin: 0; padding: 0; }\n10. Do not wrap output in markdown fences or code blocks. No explanations before or after.\n\nOutput format:\n${exampleStr}`

        systemPrompt = `You are a UI Component Extractor. Output ${allBuildEntries.length} separate HTML files — one per connection. Use "--- SourceName_TargetName ---" separators.\n\nSUPPORTED CATEGORIES: Backgrounds, Bars, Buttons, Cards, Code, Color Palettes, Dashboard, Data, Feedback, Glass, Grids, Inputs, Layout, Media, Navigation, Skeletons, Status, Switches, Tabs, Typography.\n\nBuild instructions:\n${buildLines}`
        userMsg = `${actionLabel}\n\n${contextParts.join('\n\n')}\n\n${compilerInstruction}`
      }
    } else {
      // Include element context even in non-compile mode
      if (allEls.length > 0 && contextParts.length === 0) {
        allEls.forEach(el => {
          contextParts.push(`${el.name} (${el.category}):\nCSS:\n${el.css}\n\nHTML:\n${el.html}`)
        })
      }
      systemPrompt = selectedAction.id === 'game'
        ? (apiSettings.gameSystemPrompt || GAME_SYSTEM_PROMPT)
        : allEls.length > 0
        ? 'You are an expert web developer. When the user provides a component, use its CSS and HTML as context for your response.'
        : 'You are an expert web developer. Generate complete, production-ready HTML/CSS/JS code based on the user request. Output full HTML files with embedded CSS and JS.'
      userMsg = contextParts.length > 0
        ? `${actionLabel}\n\n${contextParts.join('\n\n')}\n\n${promptText}`
        : promptText || actionLabel
    }
    addAiMessage({ role: 'user', content: userMsg })
    if (!overridePrompt) setAiInput('')

    setAiIsGenerating(true)
    lastAssistantIdRef.current = null
    tokenCountRef.current = 0
    setTokenCount(0)

    abortRef.current?.abort()
    let finalSystemPrompt = systemPrompt
    if (apiSettings.provider === 'llama' && apiSettings.disableReasoning) {
      finalSystemPrompt += "\n\nIMPORTANT: Skip reasoning. Do NOT output <think> tags. Respond with code immediately."
    }
    lastSystemPromptRef.current = finalSystemPrompt
    const messages = [
      { role: 'system', content: finalSystemPrompt },
      ...useAppStore.getState().aiMessages.slice(-20).map(m => ({ role: m.role, content: m.content })),
    ]
    const assistantId = addAiMessage({ role: 'assistant', content: '' })
    abortRef.current = new AbortController()

    const flushStream = (final: string, finalReasoning: string = '') => {
      if (streamThrottleRef.current) { clearTimeout(streamThrottleRef.current); streamThrottleRef.current = null }
      updateAiMessageContent(assistantId, final)
        if (finalReasoning) updateAiMessageReasoning(assistantId, finalReasoning)
        tokenCountRef.current = calcTokens(final, finalReasoning)
        setTokenCount(tokenCountRef.current)
        messageTokenCounts.current.set(assistantId, tokenCountRef.current)
      }

    const cfg = getApiConfig()
    const isGemini = cfg.provider === 'gemini'
    if (isGemini) {
      fetch(cfg.url, {
        method: 'POST',
        headers: cfg.headers,
        body: buildApiBody(messages, 16384, true),
        signal: abortRef.current.signal,
      }).then(async (res) => {
        if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
        const text = await res.text()
        let fullContent = ''
        try {
          const parsed = JSON.parse(text)
          fullContent = parsed.candidates?.map((c: any) => c.content?.parts?.map((p: any) => p.text).join('')).join('') || '(empty)'
        } catch { fullContent = `Parse error: ${text.slice(0, 200)}` }
        flushStream(fullContent, '')
        setAiIsGenerating(false)
        abortRef.current = null
        lastAssistantIdRef.current = assistantId
      }).catch(err => {
        if (err.name === 'AbortError') { lastAssistantIdRef.current = assistantId; return }
        flushStream('Error: ' + err.message)
        setAiIsGenerating(false)
        abortRef.current = null
        lastAssistantIdRef.current = assistantId
      })
    } else {
      fetch(cfg.url, {
        method: 'POST',
        headers: cfg.headers,
        body: buildApiBody(messages, 16384, false),
        signal: abortRef.current.signal,
      }).then(async (res) => {
        if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
        if (!res.body) throw new Error('No response body')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''
        let fullReasoning = ''

        const throttledUpdate = () => {
          if (streamThrottleRef.current) return
          streamThrottleRef.current = setTimeout(() => {
            streamThrottleRef.current = null
            updateAiMessageContent(assistantId, fullContent)
            if (fullReasoning) updateAiMessageReasoning(assistantId, fullReasoning)
            tokenCountRef.current = calcTokens(fullContent, fullReasoning)
            setTokenCount(tokenCountRef.current)
          }, 30)
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || trimmed === 'data: [DONE]') continue
              if (trimmed.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(trimmed.slice(6))
                  const delta = parsed.choices?.[0]?.delta
                  if (delta?.reasoning_content && !apiSettings.disableReasoning) {
                    fullReasoning += delta.reasoning_content
                    throttledUpdate()
                  }
                  if (delta?.content) {
                    fullContent += delta.content
                    throttledUpdate()
                  }
                } catch { /* skip partial */ }
              }
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            flushStream(fullContent + '\n\n*(Stopped)*', fullReasoning)
          } else throw err
        }
        if (buffer && buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(buffer.slice(6))
            const delta = parsed.choices?.[0]?.delta
            if (delta?.reasoning_content && !apiSettings.disableReasoning) fullReasoning += delta.reasoning_content
            if (delta?.content) fullContent += delta.content
          } catch { /* skip */ }
        }
        flushStream(fullContent, fullReasoning)
        setAiIsGenerating(false)
        abortRef.current = null
        lastAssistantIdRef.current = assistantId
      }).catch(err => {
        if (err.name === 'AbortError') {
          lastAssistantIdRef.current = assistantId
          return
        }
        flushStream('Error: ' + err.message)
        setAiIsGenerating(false)
        abortRef.current = null
        lastAssistantIdRef.current = assistantId
      })
    }
  }

  const handleContinue = () => {
    const assistantId = lastAssistantIdRef.current
    if (!assistantId) return
    const lastAssistant = aiMessages.find(m => m.id === assistantId)
    if (!lastAssistant) return
    const partialContent = lastAssistant.content
    if (!partialContent) return

    setAiIsGenerating(true)
    lastAssistantIdRef.current = null
    tokenCountRef.current = 0
    setTokenCount(0)

    const newAssistantId = addAiMessage({ role: 'assistant', content: '' })
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const continueMsg = `Continue generating the rest of the code exactly from where you left off. Do NOT repeat anything you already wrote. Your last response ended with:\n\n"${partialContent.slice(-200)}"\n\nNow continue seamlessly.`

    const messages = [
      { role: 'system', content: lastSystemPromptRef.current || 'You are an expert web developer. Continue the code exactly from where it stopped. Do not re-output any part that was already written.' },
      { role: 'user', content: lastUserMsgRef.current },
      { role: 'assistant', content: partialContent },
      { role: 'user', content: continueMsg },
    ]

    const flushStream = (final: string, finalReasoning: string = '') => {
      if (streamThrottleRef.current) { clearTimeout(streamThrottleRef.current); streamThrottleRef.current = null }
      updateAiMessageContent(newAssistantId, final)
      if (finalReasoning) updateAiMessageReasoning(newAssistantId, finalReasoning)
      tokenCountRef.current = calcTokens(final, finalReasoning)
      setTokenCount(tokenCountRef.current)
      messageTokenCounts.current.set(newAssistantId, tokenCountRef.current)
    }

    const cfg = getApiConfig()
    const isGemini = cfg.provider === 'gemini'
    if (isGemini) {
      fetch(cfg.url, {
        method: 'POST',
        headers: cfg.headers,
        body: buildApiBody(messages, 16384, true),
        signal: abortRef.current.signal,
      }).then(async (res) => {
        if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
        const text = await res.text()
        let fullContent = ''
        try {
          const parsed = JSON.parse(text)
          fullContent = parsed.candidates?.map((c: any) => c.content?.parts?.map((p: any) => p.text).join('')).join('') || '(empty)'
        } catch { fullContent = `Parse error: ${text.slice(0, 200)}` }
        flushStream(fullContent, '')
        setAiIsGenerating(false)
        abortRef.current = null
        lastAssistantIdRef.current = newAssistantId
      }).catch(err => {
        if (err.name === 'AbortError') { lastAssistantIdRef.current = newAssistantId; return }
        flushStream('Error: ' + err.message)
        setAiIsGenerating(false)
        abortRef.current = null
        lastAssistantIdRef.current = newAssistantId
      })
    } else {
      fetch(cfg.url, {
        method: 'POST',
        headers: cfg.headers,
        body: buildApiBody(messages, 16384, false),
        signal: abortRef.current.signal,
      }).then(async (res) => {
        if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
        if (!res.body) throw new Error('No response body')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''
        let fullReasoning = ''

        const throttledContinueUpdate = () => {
          if (streamThrottleRef.current) return
          streamThrottleRef.current = setTimeout(() => {
            streamThrottleRef.current = null
            updateAiMessageContent(newAssistantId, fullContent)
            if (fullReasoning) updateAiMessageReasoning(newAssistantId, fullReasoning)
            tokenCountRef.current = calcTokens(fullContent, fullReasoning)
            setTokenCount(tokenCountRef.current)
          }, 30)
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || trimmed === 'data: [DONE]') continue
              if (trimmed.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(trimmed.slice(6))
                  const delta = parsed.choices?.[0]?.delta
                  if (delta?.reasoning_content && !apiSettings.disableReasoning) {
                    fullReasoning += delta.reasoning_content
                    throttledContinueUpdate()
                  }
                  if (delta?.content) {
                    fullContent += delta.content
                    throttledContinueUpdate()
                  }
                } catch { /* skip */ }
              }
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            flushStream(fullContent + '\n\n*(Stopped)*', fullReasoning)
          } else throw err
        }
        if (buffer && buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(buffer.slice(6))
            const delta = parsed.choices?.[0]?.delta
            if (delta?.reasoning_content && !apiSettings.disableReasoning) fullReasoning += delta.reasoning_content
            if (delta?.content) fullContent += delta.content
          } catch { /* skip */ }
        }
        flushStream(fullContent, fullReasoning)
        setAiIsGenerating(false)
        abortRef.current = null
        lastAssistantIdRef.current = newAssistantId
      }).catch(err => {
        if (err.name === 'AbortError') {
          lastAssistantIdRef.current = newAssistantId
          return
        }
        flushStream('Error: ' + err.message)
        setAiIsGenerating(false)
        abortRef.current = null
        lastAssistantIdRef.current = newAssistantId
      })
    }
  }

  const connectedCount = connectedElements.length

  const handleSendToCanvas = (content: string) => {
    const parts = content.split(/(?=--- )/).filter(Boolean)
    if (parts.length > 1) {
      parts.forEach((part, i) => {
        const nameMatch = part.match(/^--- (.+?) ---/)
        const name = nameMatch ? nameMatch[1].trim() : `Component ${i + 1}`
        let html = part.replace(/^--- .+? ---\s*/, '').trim()
        let css = ''
        const cssMatch = html.match(/```css\n([\s\S]*?)```/)
        if (cssMatch) css = cssMatch[1]
        const htmlMatch = html.match(/```html\n([\s\S]*?)```/)
        if (htmlMatch) html = htmlMatch[1]
        if (!htmlMatch) {
          const genericMatch = html.match(/```(?:\w*)\n([\s\S]*?)```/)
          if (genericMatch) html = genericMatch[1]
        }
        if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) return
        useAppStore.getState().addCanvasElement({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          componentId: 'ai-output-' + i,
          x: 100 + Math.random() * 200 + i * 30, y: 100 + Math.random() * 200 + i * 30,
          width: 360, height: 240,
          name, category: 'AI', type: 'ai' as const,
          html, css, description: 'Generated by AI',
          source: 'ai' as const, mode: 'source' as const,
        })
      })
    } else {
      let html = content
      let css = ''
      const cssMatch = content.match(/```css\n([\s\S]*?)```/)
      if (cssMatch) css = cssMatch[1]
      const htmlMatch = content.match(/```html\n([\s\S]*?)```/)
      if (htmlMatch) html = htmlMatch[1]
      if (!htmlMatch) {
        const genericMatch = content.match(/```(?:\w*)\n([\s\S]*?)```/)
        if (genericMatch) html = genericMatch[1]
      }
      useAppStore.getState().addCanvasElement({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        componentId: 'ai-output',
        x: 100 + Math.random() * 200, y: 100 + Math.random() * 200,
        width: 360, height: 240,
        name: 'AI Generated', category: 'AI', type: 'ai' as const,
        html, css, description: 'Generated by AI',
        source: 'ai' as const, mode: 'source' as const,
      })
    }
  }

  const handlePanelResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizeRef.current = true
    const startX = e.clientX
    const startW = panelWidth
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const newW = Math.max(200, Math.min(600, startW - (ev.clientX - startX)))
      setPanelWidth(newW)
    }
    const onUp = () => { resizeRef.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [panelWidth])

  return (
    <div className="generate-window" style={{ width: panelWidth, minWidth: panelWidth }}>
      <div className="gw-resize-handle" onMouseDown={handlePanelResize} />
      <div className="gw-tabs">
        <button className={`gw-tab${activeTab === 'generate' ? ' active' : ''}`} onClick={() => setActiveTab('generate')}>Generate</button>
        <button className={`gw-tab${activeTab === 'ai' ? ' active' : ''}`} onClick={() => setActiveTab('ai')}>AI</button>
        <button className={`gw-tab${activeTab === 'quick' ? ' active' : ''}`} onClick={() => { setActiveTab('quick'); setQuickUnviewedCount(0) }} style={{ position: 'relative' }}>
          Quick
          {quickUnviewedCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -6, fontSize: 9,
              background: '#00c8ff', color: '#fff',
              borderRadius: 8, padding: '0 4px', lineHeight: '14px', minWidth: 14, textAlign: 'center',
            }}>{quickUnviewedCount}</span>
          )}
        </button>
      </div>

      {activeTab === 'generate' && (
        <>
          <div className="gw-header">
            <div className="gw-info">
              <span className="gw-count">
                {canvasElements.length > 0
                  ? `${connectedCount} of ${canvasElements.length} connected`
                  : '0 elements'}
              </span>
            </div>
            <button onClick={() => { setOutput(''); setLiveText(''); setGenAiResult(''); setGenAiInput(''); setIsGenerating(false); if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } }}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] border-none cursor-pointer"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#666' }}
            >Clear</button>
          </div>

          {isGenerating && (
            <div className="gw-progress">
              <div className="gw-progress-bar">
                <div className="gw-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="gw-progress-text">{progress}%</span>
            </div>
          )}

          <div className="gw-output" ref={outputRef}>
            {(output || liveText || genAiLoading || genAiResult) ? (
              <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="gw-output-toolbar">
                  <span style={{ fontSize: 10, color: '#666', fontWeight: 500 }}>
                    {genAiLoading ? 'AI Generating...' : genAiResult ? 'AI Result' : canvasMode === 'source' ? 'Source Code' : 'Designer Info'}
                  </span>
                  <div className="flex items-center gap-1">
                    {output && !genAiResult && !genAiLoading && (
                      <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                        className="gw-copy-btn" style={{ color: copied ? '#22c55e' : '#aaa' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="12" height="12" fill="currentColor"><path d="M480 400L288 400C279.2 400 272 392.8 272 384L272 128C272 119.2 279.2 112 288 112L421.5 112C425.7 112 429.8 113.7 432.8 116.7L491.3 175.2C494.3 178.2 496 182.3 496 186.5L496 384C496 392.8 488.8 400 480 400zM288 448L480 448C515.3 448 544 419.3 544 384L544 186.5C544 169.5 537.3 153.2 525.3 141.2L466.7 82.7C454.7 70.7 438.5 64 421.5 64L288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L368 496L368 512C368 520.8 360.8 528 352 528L160 528C151.2 528 144 520.8 144 512L144 256C144 247.2 151.2 240 160 240L176 240L176 192L160 192z"/></svg>
                        {copied ? 'Done' : 'Copy'}
                      </button>
                    )}
                    {genAiResult && !genAiLoading && (
                      <button onClick={sendGenToCanvas}
                        className="gw-canvas-btn">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                        +Canvas
                      </button>
                    )}
                  </div>
                </div>
                <div className="gw-output-body">
                  {genAiLoading || genAiResult ? (
                    <pre className="gw-output-text" style={{
                      fontFamily: 'Consolas, Menlo, Monaco, monospace', fontSize: 12, lineHeight: 1.6,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#e2e2e8',
                    }}>{genAiResult || (genAiLoading ? 'Waiting for AI response...' : '')}</pre>
                  ) : output ? (
                    <pre className="gw-output-text" style={{
                      fontFamily: 'Consolas, Menlo, Monaco, monospace', fontSize: 12,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#e2e2e8',
                      padding: '8px 12px', margin: 0, lineHeight: 1.6,
                    }}>{output}</pre>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="gw-placeholder">
                {canvasElements.length === 0
                  ? 'Add components to the canvas and connect them, then generate output.'
                  : connectedCount === 0
                    ? 'No connected nodes. Connect nodes by adding multiple elements to the canvas.'
                    : 'Press "Generate" to see the result.'}
              </div>
            )}
          </div>

          {output && (
            <div className="ai-input-bar" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="ai-input-wrap" style={{ padding: '4px 8px 6px' }}>
                <div ref={genDropdownRef} className="relative flex-shrink-0">
                  <button onClick={() => setGenShowDropdown(!genShowDropdown)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border-none cursor-pointer whitespace-nowrap"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#888' }}
                  >
                    {genSelectedAction.label}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  {genShowDropdown && (
                    <div className="absolute bottom-full left-0 mb-1.5 rounded-xl overflow-hidden shadow-xl border z-50"
                      style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.08)', minWidth: 160, maxHeight: 300, overflowY: 'auto' }}>
                      {GEN_ACTIONS.map(a => (
                        <button key={a.id}
                          onClick={() => { setGenSelectedAction(a); setGenShowDropdown(false) }}
                          className="w-full text-left px-3 py-2 text-[11px] border-none cursor-pointer hover:bg-[rgba(255,255,255,0.04)]"
                          style={{ color: genSelectedAction.id === a.id ? '#f093fb' : '#ccc' }}
                        >{a.label}</button>
                      ))}
                    </div>
                  )}
                </div>
                <textarea ref={genTextareaRef} value={genAiInput}
                  onChange={e => { setGenAiInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && !genAiLoading && output) {
                      e.preventDefault(); handleGenAiSend()
                    }
                  }}
                  rows={1} placeholder="Describe the component you want..."
                />
                {genAiLoading ? (
                  <button onClick={() => { genAbortRef.current?.abort(); setGenAiLoading(false) }}
                    className="ai-send-btn stop" title="Stop">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                  </button>
                ) : (
                  <button onClick={handleGenAiSend} disabled={(genSelectedAction.id === 'ask' && !genAiInput.trim()) || !output || genAiLoading}
                    className="ai-send-btn" title="Send">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'ai' && (
        <>
          <div className="gw-header" style={{ padding: '4px 0' }}>
            <div className="gw-info">
              <span className="flex items-center gap-1">
                {apiSettings.connected ? (
                  <LottieAnimation animationData={serverRunningJson} size={24} />
                ) : (
                  <LottieAnimation animationData={serverNotRunningJson} size={24} />
                )}
              </span>
              <span className="text-[9px]" style={{ color: '#555' }}>{aiMessages.length} msgs</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { abortRef.current?.abort(); if (streamThrottleRef.current) clearTimeout(streamThrottleRef.current); clearAiMessages(); setCleaning(true); setTimeout(() => setCleaning(false), 1200) }}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] border-none cursor-pointer"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#666' }}
              >{cleaning ? <LottieAnimation animationData={broomJson} size={16} /> : null}Clear</button>
            </div>
          </div>

          <div className="gw-output ai-output" ref={aiOutputRef}>
            {aiMessages.length === 0 ? (
              <div className="ai-welcome">
                <h1 className="text-gradient">Hello there,</h1>
                <h1 className="text-gradient" style={{ fontSize: 15 }}>How can I help you?</h1>
                <p>Select a node or connect elements via anchors, then ask anything</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <AiMessageList messages={aiMessages} onSendToCanvas={handleSendToCanvas} messageTokenCounts={messageTokenCounts.current} />
                {aiIsGenerating && (
                  <div style={{ alignSelf: 'flex-start', marginTop: 4, padding: '6px 10px', fontSize: 11, color: '#999', lineHeight: 1.5, background: '#1a1a1a', borderRadius: 6, borderLeft: '2px solid #f093fb', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="#333" strokeWidth="3" fill="none" />
                      <circle cx="12" cy="12" r="10" stroke="#f093fb" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="62.83" strokeDashoffset="20" />
                    </svg>
                    <span>Generating</span>
                    <span style={{ color: '#666', fontSize: 10 }}>+{tokenCount.toLocaleString()} tokens</span>
                  </div>
                )}
                {!aiIsGenerating && lastAssistantIdRef.current && aiMessages.length > 0 && (
                  <button onClick={handleContinue}
                    style={{ alignSelf: 'flex-start', padding: '4px 12px', fontSize: 10, color: '#f093fb', background: 'rgba(240,147,251,0.1)', border: '1px solid rgba(240,147,251,0.2)', borderRadius: 6, cursor: 'pointer', marginTop: 2 }}>
                    Continue
                  </button>
                )}
              </div>
            )}
            {userScrolledUp && (
              <button onClick={() => { if (aiOutputRef.current) { aiOutputRef.current.scrollTop = aiOutputRef.current.scrollHeight; setUserScrolledUp(false) } }}
                style={{ position: 'sticky', bottom: 8, left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', fontSize: 10, color: '#ccc', background: '#2a2a2a', border: '1px solid #444', borderRadius: 12, cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                ↓ Scroll to bottom
              </button>
            )}
          </div>

          {targetActive && connectedEls.length > 0 && (
            <div className="flex flex-col gap-1 px-1 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => { setTargetActive(false); setDropdownDisabled(false) }}
                  style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '1px 5px', fontSize: 9, lineHeight: 1.4 }}
                  title="Exit Target Mode">✕</button>
                <div onClick={() => setTargetExpanded(!targetExpanded)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none', flex: 1 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, flex: 1, background: 'linear-gradient(90deg, #667eea, #f093fb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TARGET MODE — {aiConnections.length} connections to {connectedEls.length} elements</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" style={{ transform: targetExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s' }}>
                    <path d="M6 15l6-6 6 6"/>
                  </svg>
                </div>
              </div>
              {targetExpanded && (() => {
                // Group by element ID, show which AI targets each connects to
                const grouped = new Map<string, { el: NonNullable<typeof selectedEl>; targets: string[] }>()
                aiConnections.forEach(conn => {
                  const el = canvasElements.find(e => e.id === conn.canvasElementId)
                  if (!el) return
                  const targetNode = aiTargetNodes.find(n => n.id === conn.aiTargetId)
                  const targetLabel = targetNode ? targetNode.category : conn.aiTargetId
                  if (!grouped.has(el.id)) {
                    grouped.set(el.id, { el, targets: [] })
                  }
                  grouped.get(el.id)!.targets.push(targetLabel)
                })
                return Array.from(grouped.values()).map(({ el, targets }) => (
                  <div key={el.id} style={{ fontSize: 10, color: '#ccc', lineHeight: 1.5, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ color: '#f093fb', fontWeight: 600 }}>{el.name}</span>
                      <span style={{ color: '#999', fontSize: 9, background: 'rgba(51,51,51,0.5)', padding: '1px 4px', borderRadius: 3 }}>{el.category}</span>
                      <span style={{ color: '#888', fontSize: 8 }}>→ {targets.join(', ')}</span>
                    </div>
                    <div style={{ fontSize: 9, color: '#666', fontFamily: 'monospace', maxHeight: 60, overflow: 'auto' }}>
                      <span style={{ color: '#888' }}>CSS:</span> {el.css.substring(0, 120)}...
                      <br/><span style={{ color: '#888' }}>HTML:</span> {el.html.substring(0, 120)}...
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}

          <div className="ai-input-bar">
            <div className="ai-input-wrap">
              <div ref={dropdownRef} className="relative flex-shrink-0">
                <button onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border-none cursor-pointer whitespace-nowrap"
                  style={{ backgroundColor: targetActive ? 'rgba(240, 147, 251, 0.15)' : 'rgba(255,255,255,0.06)', color: targetActive ? '#f093fb' : '#888' }}
                >
                  {selectedAction.label}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {showDropdown && (
                  <div className="absolute bottom-full left-0 mb-1.5 rounded-xl overflow-hidden shadow-xl border z-50"
                    style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.08)', minWidth: 160 }}>
                    {AI_ACTIONS.map(a => (
                      <button key={a.id}
                        onClick={() => {
                          setSelectedAction(a);
                          setShowDropdown(false);
                          if (a.id === 'compile') {
                            setTargetActive(true);
                            setDropdownDisabled(true);
                          } else {
                            setTargetActive(false);
                            setDropdownDisabled(false);
                          }
                          if ((selectedEl || connectedEls.length > 0) && !aiIsGenerating) {
                            handleAiSend()
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-[11px] border-none cursor-pointer hover:bg-[rgba(255,255,255,0.04)]"
                        style={{ color: selectedAction.id === a.id ? '#f093fb' : '#ccc' }}
                      >{a.label}</button>
                    ))}
                    <div className="h-px my-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                    <button onClick={() => { 
                        const newTargetActive = !targetActive
                        setTargetActive(newTargetActive)
                        if (newTargetActive) {
                          setSelectedAction(AI_ACTIONS.find(a => a.id === 'compile')!)
                          setDropdownDisabled(true)
                        } else {
                          setSelectedAction(AI_ACTIONS[0])
                          setDropdownDisabled(false)
                        }
                        setShowDropdown(false) 
                      }}
                      className="w-full text-left px-3 py-2 text-[11px] border-none cursor-pointer hover:bg-[rgba(255,255,255,0.04)] font-medium"
                      style={{ color: targetActive ? '#999' : '#f093fb', backgroundColor: targetActive ? 'rgba(51,51,51,0.4)' : 'transparent' }}
                    >{targetActive ? '✓ Target Mode Active' : 'Target Mode'}</button>
                  </div>
                )}
              </div>
              <textarea ref={textareaRef} value={aiInput} onChange={e => { setAiInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && !aiIsGenerating) {
                    e.preventDefault(); handleAiSend()
                  }
                }}
                rows={1} placeholder={selectedAction.id === 'game' ? 'Describe the game you want...' : selectedEl ? `Ask about "${selectedEl.name}"...` : 'Type your question here...'}
              />
              {aiIsGenerating ? (
                <button onClick={() => { abortRef.current?.abort(); setAiIsGenerating(false) }}
                  className="ai-send-btn stop" title="Stop">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                </button>
              ) : (
                <button onClick={() => handleAiSend()} disabled={!aiInput.trim() && !selectedEl && connectedEls.length === 0}
                  className="ai-send-btn" title="Send">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'quick' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="gw-header">
            <div className="gw-info">
              <span className="gw-count" style={{ fontSize: 10, color: '#888' }}>{quickResults.length} saved</span>
            </div>
            <span style={{ fontSize: 9, color: '#555', padding: '2px 6px', borderRadius: 4, background: '#1a1a1a' }}>Quick Results</span>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ padding: '4px 6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, alignContent: 'start' }}>
              {/* Skeleton cards that reserve space — shown even when results exist */}
              {quickResults.length === 0 ? (
                <>
                  {[1, 2, 3, 4].map(i => (
                    <div key={'skel-' + i} style={{
                      background: '#1a1a1a', borderRadius: 8, border: '1px solid #2a2a2a',
                      overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 172,
                    }}>
                      <div style={{ height: 24, background: '#222', borderRadius: '8px 8px 0 0' }} />
                      <div style={{ flex: 1, background: '#1e1e1e', position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.5s infinite',
                        }} />
                      </div>
                      <div style={{ height: 28, background: '#222', borderRadius: '0 0 8px 8px' }} />
                    </div>
                  ))}
                </>
              ) : (
                [...quickResults].reverse().map(r => {
                  let displayHtml = r.html
                  const trimmed = displayHtml.trim()
                  if (!trimmed.startsWith('<!DOCTYPE') && !trimmed.startsWith('<html')) {
                    displayHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=320,initial-scale=0.3,maximum-scale=0.3,user-scalable=no"><style>*{box-sizing:border-box;margin:0;padding:0}html,body{overflow:hidden!important;width:100%;height:100%;background:#fff}body{transform-origin:top left;transform:scale(0.3);width:333.33%;height:333.33%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#e0e0e0;padding:20px}</style></head><body>' + displayHtml + '</body></html>'
                  } else {
                    // Inject thumbnail CSS into existing HTML
                    displayHtml = displayHtml.replace('</head>', '<meta name="viewport" content="width=320,initial-scale=0.3,maximum-scale=0.3,user-scalable=no"><style>html,body{overflow:hidden!important;width:100%;height:100%}body{transform-origin:top left;transform:scale(0.3);width:333.33%;height:333.33%}</style></head>')
                  }
                  const isHtml = true // always show iframe since we wrap it
                  return (
                    <div key={r.id} style={{
                      background: '#1a1a1a', borderRadius: 8, border: '1px solid #2a2a2a',
                      overflow: 'hidden', display: 'flex', flexDirection: 'column',
                      height: 172,
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px',
                        borderBottom: '1px solid #2a2a2a', fontSize: 9, height: 24, flexShrink: 0,
                      }}>
                        <span style={{ color: '#e0e0e0', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                        <span style={{ color: '#888', flexShrink: 0 }}>{new Date(r.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0, borderRadius: 0 }}>
                        <iframe
                          srcDoc={displayHtml}
                          style={{ width: '100%', height: '100%', border: 'none', background: '#fff', pointerEvents: 'none' }}
                          title={r.label}
                          sandbox="allow-scripts allow-same-origin"
                          scrolling="no"
                        />
                      </div>
                      <div style={{
                        display: 'flex', gap: 2, padding: '3px 4px',
                        borderTop: '1px solid #2a2a2a', height: 28, flexShrink: 0, alignItems: 'center',
                      }}>
                        <button onClick={() => useAppStore.getState().removeQuickResult(r.id)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] cursor-pointer"
                          style={{ backgroundColor: '#1a1a1a', color: '#e0e0e0', border: '1px solid #2a2a2a', transition: 'all .15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#00c8ff'; (e.currentTarget as HTMLElement).style.color = '#00c8ff' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.color = '#e0e0e0' }}
                        >Delete</button>
                        <button onClick={() => {
                          useAppStore.getState().addCanvasElement({
                            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
                            componentId: 'quick-' + r.id,
                            x: 100 + Math.random() * 200, y: 100 + Math.random() * 200,
                            width: 360, height: 240,
                            name: r.label, category: r.category || 'AI', type: 'ai' as const,
                            html: displayHtml, css: '', description: 'Quick generated',
                            source: 'ai' as const, mode: 'source' as const,
                          })
                        }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] cursor-pointer"
                          style={{ backgroundColor: '#1a1a1a', color: '#e0e0e0', border: '1px solid #2a2a2a', transition: 'all .15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#00c8ff'; (e.currentTarget as HTMLElement).style.color = '#00c8ff' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.color = '#e0e0e0' }}
                        >+Canvas</button>
                        <button onClick={() => { setPreviewHtml(r.html); setPreviewTitle(r.label) }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] cursor-pointer"
                          style={{ backgroundColor: '#1a1a1a', color: '#e0e0e0', border: '1px solid #2a2a2a', transition: 'all .15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f093fb'; (e.currentTarget as HTMLElement).style.color = '#f093fb' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.color = '#e0e0e0' }}
                        ><svg width="10" height="10" viewBox="-3.5 0 32 32" fill="#e0e0e0" style={{ opacity: 0.8 }}><path d="M12.406 13.844c1.188 0 2.156 0.969 2.156 2.156s-0.969 2.125-2.156 2.125-2.125-0.938-2.125-2.125 0.938-2.156 2.125-2.156zM12.406 8.531c7.063 0 12.156 6.625 12.156 6.625 0.344 0.438 0.344 1.219 0 1.656 0 0-5.094 6.625-12.156 6.625s-12.156-6.625-12.156-6.625c-0.344-0.438-0.344-1.219 0-1.656 0 0 5.094-6.625 12.156-6.625zM12.406 21.344c2.938 0 5.344-2.406 5.344-5.344s-2.406-5.344-5.344-5.344-5.344 2.406-5.344 5.344 2.406 5.344 5.344 5.344z"/></svg></button>
                        <button onClick={() => {
                          useAppStore.getState().saveImport({
                            name: r.label, html: displayHtml, css: '', source: 'quick'
                          })
                        }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] cursor-pointer"
                          style={{ backgroundColor: '#1a1a1a', color: '#e0e0e0', border: '1px solid #2a2a2a', transition: 'all .15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#00c8ff'; (e.currentTarget as HTMLElement).style.color = '#00c8ff' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.color = '#e0e0e0' }}
                        >Save</button>
                      </div>
                    </div>
                  )
                })
              )}
              {/* Always add a skeleton at the end to hint more space */}
              <div style={{
                background: '#1a1a1a', borderRadius: 8, border: '1px solid #2a2a2a',
                overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 172,
                opacity: 0.5,
              }}>
                <div style={{ height: 24, background: '#222', borderRadius: '8px 8px 0 0' }} />
                <div style={{ flex: 1, background: '#1e1e1e', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                  }} />
                </div>
                <div style={{ height: 28, background: '#222', borderRadius: '0 0 8px 8px' }} />
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Full-page HTML Preview Modal */}
      {previewHtml && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', background: '#1a1a1a', borderBottom: '1px solid #2a2a2a',
            flexShrink: 0,
          }}>
            <span style={{ color: '#e0e0e0', fontSize: 13, fontWeight: 600 }}>
              {previewTitle || 'Preview'}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => {
                  const blob = new Blob([previewHtml], { type: 'text/html' })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = (previewTitle || 'preview').replace(/[^a-zA-Z0-9]/g, '_') + '.html'
                  a.click()
                  URL.revokeObjectURL(a.href)
                }}
                style={{
                  background: '#222', color: '#e0e0e0', border: '1px solid #333',
                  borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#667eea'; (e.currentTarget as HTMLElement).style.color = '#667eea' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#333'; (e.currentTarget as HTMLElement).style.color = '#e0e0e0' }}
              >Download</button>
              <button
                onClick={() => { setPreviewHtml(null); setPreviewTitle('') }}
                style={{
                  background: '#333', color: '#fff', border: 'none',
                  borderRadius: 6, width: 28, height: 28, fontSize: 14,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', transition: 'all .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e74c3c' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#333' }}
              >✕</button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <iframe
              srcDoc={previewHtml}
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
              title="Full Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}

    </div>
  )
}

export default GenerateWindow
