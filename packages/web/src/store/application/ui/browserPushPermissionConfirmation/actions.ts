import { createCustomAction } from 'typesafe-actions'

export const OPEN = 'BROWSER_PUSH_PERMISSION_MODAL/OPEN'
export const CLOSE = 'BROWSER_PUSH_PERMISSION_MODAL/CLOSE'

export const open = createCustomAction(OPEN, () => ({}))
export const close = createCustomAction(CLOSE, () => ({}))
