import { Buffer } from 'buffer'

import processBrowser from 'process/browser'
window.Buffer = Buffer
window.process = { ...processBrowser, env: process.env }
