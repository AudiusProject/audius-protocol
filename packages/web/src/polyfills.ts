import { Buffer } from 'buffer'

import processBrowser from 'process/browser'
// @ts-ignore
window.Buffer = Buffer
window.process = { ...processBrowser, env: process.env }
