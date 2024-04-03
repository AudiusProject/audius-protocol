import { vi } from 'vitest'

// @ts-ignore
global.jest = vi
const getCanvasWindow = require('jest-canvas-mock/lib/window').default
const apis = [
  'Path2D',
  'CanvasGradient',
  'CanvasPattern',
  'CanvasRenderingContext2D',
  'DOMMatrix',
  'ImageData',
  'TextMetrics',
  'ImageBitmap',
  'createImageBitmap'
] as const

const canvasWindow = getCanvasWindow({ document: window.document })

apis.forEach((api) => {
  global[api] = canvasWindow[api]
  // @ts-ignore
  global.window[api] = canvasWindow[api]
})
