export interface ConfigField {
  id: string
  label: string
  type: 'multi-select' | 'single-select' | 'toggle' | 'number' | 'textarea'
  options?: string[]
  min?: number
  max?: number
  placeholder?: string
}

export interface CategoryConfig {
  category: string
  fields: ConfigField[]
}

export const QUICK_CONFIGS: Record<string, ConfigField[]> = {
  Buttons: [
    { id: 'buttonType', label: 'Button type', type: 'multi-select', options: ['Primary', 'Secondary', 'Outline', 'Ghost', 'Gradient', 'Icon-only', 'Split', 'Loading', 'Toolbar group'] },
    { id: 'shape', label: 'Shape', type: 'single-select', options: ['Square', 'Rounded', 'Pill'] },
    { id: 'size', label: 'Size', type: 'single-select', options: ['Small', 'Medium', 'Large'] },
    { id: 'styleEra', label: 'Style era', type: 'single-select', options: ['Modern', 'Minimal', 'Retro', 'Neumorphic', 'Glassmorphism', 'Flat'] },
    { id: 'colorSource', label: 'Color source', type: 'single-select', options: ['Use connected palette', 'Custom hex', 'Let AI decide'] },
    { id: 'numButtons', label: 'Number of buttons', type: 'number', min: 1, max: 10 },
    { id: 'iconUsage', label: 'Icon usage', type: 'single-select', options: ['No icons', 'Leading icon', 'Trailing icon', 'Icon only'] },
    { id: 'states', label: 'State to show', type: 'multi-select', options: ['Default', 'Hover', 'Active', 'Disabled', 'Loading'] },
  ],
  Cards: [
    { id: 'cardType', label: 'Card type', type: 'single-select', options: ['Media card', 'Profile card', 'Stat card', 'Product card', 'Glass card', 'Pricing card'] },
    { id: 'layout', label: 'Layout', type: 'single-select', options: ['Vertical', 'Horizontal'] },
    { id: 'imagePosition', label: 'Image position', type: 'single-select', options: ['Top', 'Left', 'Right', 'Background', 'None'] },
    { id: 'contentFields', label: 'Content fields', type: 'multi-select', options: ['Title', 'Subtitle', 'Description', 'Tag', 'Price', 'CTA button', 'Avatar', 'Rating'] },
    { id: 'styleEra', label: 'Style era', type: 'single-select', options: ['Modern', 'Minimal', 'Retro', 'Glassmorphism', 'Brutalist'] },
    { id: 'cornerRadius', label: 'Corner radius', type: 'single-select', options: ['Sharp', 'Soft', 'Rounded', 'Pill'] },
    { id: 'shadowDepth', label: 'Shadow/depth', type: 'single-select', options: ['None', 'Subtle', 'Strong', 'Glow'] },
    { id: 'numCards', label: 'Number of cards', type: 'number', min: 1, max: 8 },
  ],
  Bars: [
    { id: 'barType', label: 'Bar type', type: 'single-select', options: ['Progress bar', 'Loading bar', 'Skeleton bar', 'Stat bar', 'Slider'] },
    { id: 'orientation', label: 'Orientation', type: 'single-select', options: ['Horizontal', 'Vertical'] },
    { id: 'fillStyle', label: 'Fill style', type: 'single-select', options: ['Solid', 'Gradient', 'Striped', 'Animated'] },
    { id: 'showLabel', label: 'Show label', type: 'single-select', options: ['Percentage', 'Text label', 'None'] },
    { id: 'thickness', label: 'Thickness', type: 'single-select', options: ['Thin', 'Medium', 'Thick'] },
    { id: 'roundedEnds', label: 'Rounded ends', type: 'toggle' },
    { id: 'numBars', label: 'Number of bars', type: 'number', min: 1, max: 5 },
  ],
  Navigation: [
    { id: 'navType', label: 'Nav type', type: 'single-select', options: ['Top navbar', 'Sidebar', 'Bottom nav (mobile)', 'Breadcrumb', 'Pagination'] },
    { id: 'position', label: 'Position', type: 'single-select', options: ['Left', 'Right', 'Center', 'Full-width'] },
    { id: 'numLinks', label: 'Number of links', type: 'number', min: 2, max: 8 },
    { id: 'branding', label: 'Branding', type: 'single-select', options: ['Logo + text', 'Logo only', 'Text only', 'None'] },
    { id: 'activeStyle', label: 'Active state style', type: 'single-select', options: ['Underline', 'Background pill', 'Color change', 'Gradient'] },
    { id: 'sticky', label: 'Sticky/fixed', type: 'toggle' },
    { id: 'mobileBehavior', label: 'Mobile behavior', type: 'single-select', options: ['Hamburger menu', 'Collapse', 'Always visible'] },
  ],
  Inputs: [
    { id: 'inputType', label: 'Input type', type: 'multi-select', options: ['Text', 'Email', 'Password', 'Number', 'Search', 'Textarea', 'Select dropdown', 'Date', 'File upload'] },
    { id: 'labelPosition', label: 'Label position', type: 'single-select', options: ['Top', 'Left', 'Floating', 'Placeholder only'] },
    { id: 'borderStyle', label: 'Border style', type: 'single-select', options: ['Outline', 'Underline', 'Filled', 'Borderless'] },
    { id: 'validationState', label: 'Validation state', type: 'single-select', options: ['Default', 'Error', 'Success', 'Disabled'] },
    { id: 'cornerRadius', label: 'Corner radius', type: 'single-select', options: ['Sharp', 'Soft', 'Rounded'] },
    { id: 'numFields', label: 'Number of fields', type: 'number', min: 1, max: 10 },
  ],
  Tabs: [
    { id: 'tabStyle', label: 'Tab style', type: 'single-select', options: ['Underline', 'Pill', 'Boxed', 'Segmented'] },
    { id: 'orientation', label: 'Orientation', type: 'single-select', options: ['Horizontal', 'Vertical'] },
    { id: 'numTabs', label: 'Number of tabs', type: 'number', min: 2, max: 6 },
    { id: 'icons', label: 'Icons', type: 'toggle' },
    { id: 'activeIndicator', label: 'Active indicator', type: 'single-select', options: ['Color', 'Underline', 'Background', 'Gradient'] },
  ],
  Switches: [
    { id: 'switchType', label: 'Switch type', type: 'single-select', options: ['Toggle switch', 'Checkbox', 'Radio group'] },
    { id: 'size', label: 'Size', type: 'single-select', options: ['Small', 'Medium', 'Large'] },
    { id: 'onColor', label: 'On-color', type: 'single-select', options: ['Use palette', 'Custom hex'] },
    { id: 'labelPosition', label: 'Label position', type: 'single-select', options: ['Left', 'Right', 'None'] },
    { id: 'numSwitches', label: 'Number of switches', type: 'number', min: 1, max: 6 },
  ],
  Dashboard: [
    { id: 'widgetTypes', label: 'Widget types', type: 'multi-select', options: ['Stat card', 'Line chart', 'Bar chart', 'Pie chart', 'Table', 'Activity feed', 'Progress widget'] },
    { id: 'layout', label: 'Layout', type: 'single-select', options: ['Grid 2-col', 'Grid 3-col', 'Sidebar + main', 'Full-width stacked'] },
    { id: 'numWidgets', label: 'Number of widgets', type: 'number', min: 2, max: 8 },
    { id: 'styleEra', label: 'Style era', type: 'single-select', options: ['Modern', 'Minimal', 'Corporate', 'Dark analytics'] },
  ],
  Data: [
    { id: 'displayType', label: 'Display type', type: 'single-select', options: ['Table', 'List', 'Grid of items'] },
    { id: 'numColumns', label: 'Number of columns/fields', type: 'number', min: 2, max: 8 },
    { id: 'numRows', label: 'Number of rows', type: 'number', min: 1, max: 15 },
    { id: 'headerStyle', label: 'Header style', type: 'single-select', options: ['Plain', 'Colored', 'Sticky'] },
    { id: 'rowInteraction', label: 'Row interaction', type: 'multi-select', options: ['Hover highlight', 'Selectable', 'Sortable', 'Striped'] },
  ],
  Feedback: [
    { id: 'feedbackType', label: 'Feedback type', type: 'single-select', options: ['Toast', 'Alert banner', 'Modal', 'Tooltip', 'Confirmation dialog'] },
    { id: 'severity', label: 'Severity', type: 'multi-select', options: ['Success', 'Warning', 'Error', 'Info', 'Neutral'] },
    { id: 'position', label: 'Position (toast/modal)', type: 'single-select', options: ['Top', 'Bottom', 'Center', 'Corner'] },
    { id: 'dismissible', label: 'Dismissible', type: 'toggle' },
    { id: 'iconUsage', label: 'Icon usage', type: 'toggle' },
  ],
  Status: [
    { id: 'statusType', label: 'Status type', type: 'single-select', options: ['Badge', 'Chip', 'Dot indicator', 'Tag'] },
    { id: 'statesShown', label: 'States shown', type: 'multi-select', options: ['Active', 'Pending', 'Closed', 'Error', 'Online', 'Offline'] },
    { id: 'shape', label: 'Shape', type: 'single-select', options: ['Pill', 'Square', 'Circle'] },
    { id: 'numStatuses', label: 'Number of statuses', type: 'number', min: 1, max: 6 },
  ],
  Skeletons: [
    { id: 'skeletonTarget', label: 'Skeleton target', type: 'single-select', options: ['Card skeleton', 'Text lines', 'Avatar', 'Table skeleton', 'List skeleton'] },
    { id: 'animation', label: 'Animation', type: 'single-select', options: ['Shimmer', 'Pulse', 'None'] },
    { id: 'numBlocks', label: 'Number of placeholder blocks', type: 'number', min: 1, max: 8 },
  ],
  Typography: [
    { id: 'showcaseType', label: 'Showcase type', type: 'single-select', options: ['Heading scale', 'Paragraph styles', 'Quote block', 'Code text'] },
    { id: 'fontPairing', label: 'Font pairing', type: 'single-select', options: ['Use palette font', 'Serif + Sans mix', 'Custom'] },
    { id: 'weightRange', label: 'Weight range', type: 'multi-select', options: ['Light', 'Regular', 'Medium', 'Bold', 'Black'] },
  ],
  Grids: [
    { id: 'gridType', label: 'Grid type', type: 'single-select', options: ['Image grid', 'Card grid', 'Masonry', 'Equal columns'] },
    { id: 'numColumns', label: 'Number of columns', type: 'number', min: 2, max: 6 },
    { id: 'gapSize', label: 'Gap size', type: 'single-select', options: ['None', 'Small', 'Medium', 'Large'] },
    { id: 'responsive', label: 'Responsive behavior', type: 'toggle' },
  ],
  Layout: [
    { id: 'layoutType', label: 'Layout type', type: 'single-select', options: ['Sidebar + content', 'Header + footer', 'Split screen', 'Holy grail'] },
    { id: 'sidebarPosition', label: 'Sidebar position', type: 'single-select', options: ['Left', 'Right', 'None'] },
    { id: 'responsiveCollapse', label: 'Responsive collapse', type: 'toggle' },
  ],
  Media: [
    { id: 'mediaType', label: 'Media type', type: 'single-select', options: ['Image card', 'Video player UI', 'Audio player', 'Gallery', 'Avatar group'] },
    { id: 'aspectRatio', label: 'Aspect ratio', type: 'single-select', options: ['1:1', '16:9', '4:3', 'Custom'] },
    { id: 'overlayControls', label: 'Overlay controls', type: 'toggle' },
  ],
  Code: [
    { id: 'blockType', label: 'Block type', type: 'single-select', options: ['Single code block', 'Tabbed code (multi-file)', 'Inline code', 'Terminal window'] },
    { id: 'theme', label: 'Theme', type: 'single-select', options: ['Dark', 'Light', 'Match palette'] },
    { id: 'lineNumbers', label: 'Show line numbers', type: 'toggle' },
    { id: 'copyButton', label: 'Copy button', type: 'toggle' },
  ],
  Glass: [
    { id: 'elementType', label: 'Element type', type: 'single-select', options: ['Card', 'Navbar', 'Modal', 'Panel'] },
    { id: 'blurIntensity', label: 'Blur intensity', type: 'single-select', options: ['Light', 'Medium', 'Heavy'] },
    { id: 'borderStyle', label: 'Border style', type: 'single-select', options: ['Thin light border', 'No border', 'Glow border'] },
    { id: 'backgroundContext', label: 'Background context', type: 'single-select', options: ['Over image', 'Over gradient', 'Over solid color'] },
  ],
  Backgrounds: [
    { id: 'bgType', label: 'Background type', type: 'single-select', options: ['Solid', 'Gradient', 'Mesh gradient', 'Image', 'Pattern', 'Noise texture'] },
    { id: 'mood', label: 'Mood', type: 'single-select', options: ['Dark', 'Light', 'Vibrant', 'Muted', 'Pastel'] },
    { id: 'motion', label: 'Motion', type: 'single-select', options: ['Static', 'Animated'] },
  ],
  'Color Palettes': [
    { id: 'paletteSource', label: 'Palette source', type: 'single-select', options: ['Generate from a mood', 'Generate from one base color', 'Extract from uploaded image'] },
    { id: 'paletteType', label: 'Palette type', type: 'single-select', options: ['Monochrome', 'Complementary', 'Analogous', 'Triadic'] },
    { id: 'numColors', label: 'Number of colors', type: 'number', min: 3, max: 8 },
  ],
}

export const PLACEMENT_FIELDS: ConfigField[] = [
  { id: 'placement', label: 'Placement on page', type: 'single-select', options: ['Top', 'Bottom', 'Left', 'Right', 'Center', 'Floating'] },
  { id: 'alignment', label: 'Alignment within container', type: 'single-select', options: ['Start', 'Center', 'End', 'Space-between'] },
  { id: 'widthBehavior', label: 'Width behavior', type: 'single-select', options: ['Fixed width', 'Full width', 'Auto', 'Percentage'] },
]

export function buildQuickPrompt(category: string, values: Record<string, any>, explainText: string): string {
  const lines: string[] = []
  lines.push(`Generate a ${category} component.`)

  const fields = QUICK_CONFIGS[category] || []
  for (const field of fields) {
    const val = values[field.id]
    if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) continue
    if (field.type === 'toggle') {
      lines.push(`${field.label}: ${val ? 'Yes' : 'No'}`)
    } else if (Array.isArray(val)) {
      lines.push(`${field.label}: ${val.join(', ')}`)
    } else {
      lines.push(`${field.label}: ${val}`)
    }
  }

  // Placement
  for (const field of PLACEMENT_FIELDS) {
    const val = values[field.id]
    if (val) lines.push(`${field.label}: ${val}`)
  }

  if (explainText.trim()) {
    lines.push(`\nAdditional instructions: ${explainText.trim()}`)
  }

  return lines.join('\n')
}

export function buildWholePagePrompt(
  selectedCategories: string[],
  globalSettings: Record<string, any>,
  perCategoryValues: Record<string, Record<string, any>>,
  perCategoryExplain: Record<string, string>,
): string {
  const lines: string[] = []
  lines.push(`Generate a complete HTML page with the following sections in order:`)
  selectedCategories.forEach((cat, i) => lines.push(`  ${i + 1}. ${cat}`))

  // Global settings
  if (globalSettings.pageTitle) lines.push(`\nPage title: ${globalSettings.pageTitle}`)
  if (globalSettings.overallStyle) lines.push(`Overall style: ${globalSettings.overallStyle}`)
  if (globalSettings.colorMode) lines.push(`Color mode: ${globalSettings.colorMode}`)
  if (globalSettings.primaryColorSource) lines.push(`Primary color source: ${globalSettings.primaryColorSource}`)
  if (globalSettings.layoutDirection) lines.push(`Layout direction: ${globalSettings.layoutDirection}`)

  lines.push(`\n--- Per-section details ---`)
  for (const cat of selectedCategories) {
    lines.push(`\n[${cat}]`)
    const vals = perCategoryValues[cat] || {}
    const fields = QUICK_CONFIGS[cat] || []
    for (const field of fields) {
      const val = vals[field.id]
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) continue
      if (field.type === 'toggle') {
        lines.push(`  ${field.label}: ${val ? 'Yes' : 'No'}`)
      } else if (Array.isArray(val)) {
        lines.push(`  ${field.label}: ${val.join(', ')}`)
      } else {
        lines.push(`  ${field.label}: ${val}`)
      }
    }
    // Placement
    for (const pf of PLACEMENT_FIELDS) {
      const val = vals[pf.id]
      if (val) lines.push(`  ${pf.label}: ${val}`)
    }
    const explain = perCategoryExplain[cat] || ''
    if (explain.trim()) lines.push(`  Additional: ${explain.trim()}`)
  }

  return lines.join('\n')
}

export const ALL_CATEGORIES = [
  'Navigation', 'Cards', 'Buttons', 'Inputs', 'Tabs', 'Switches',
  'Dashboard', 'Data', 'Feedback', 'Status', 'Skeletons', 'Typography',
  'Grids', 'Layout', 'Media', 'Code', 'Glass', 'Backgrounds',
  'Bars', 'Color Palettes',
]

export const GLOBAL_SETTINGS_FIELDS: ConfigField[] = [
  { id: 'pageTitle', label: 'Page title / project name', type: 'textarea', placeholder: 'My Awesome Page' },
  { id: 'overallStyle', label: 'Overall style', type: 'single-select', options: ['Modern', 'Minimal', 'Classic', 'Retro', 'Glassmorphism', 'Brutalist', 'Corporate'] },
  { id: 'colorMode', label: 'Color mode', type: 'single-select', options: ['Dark', 'Light', 'Auto (palette-derived)'] },
  { id: 'primaryColorSource', label: 'Primary color source', type: 'single-select', options: ['Pick from palette', 'Custom hex input', 'Let AI choose'] },
  { id: 'layoutDirection', label: 'Layout direction', type: 'single-select', options: ['LTR', 'RTL'] },
]
