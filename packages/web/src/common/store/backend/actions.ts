export const SETUP = 'BACKEND/SETUP'
export const SETUP_BACKEND_SUCCEEDED = 'BACKEND/SETUP_BACKEND_SUCCEEDED'
export const SETUP_BACKEND_FAILED = 'BACKEND/SETUP_BACKEND_FAILED'

export function setupBackendSucceeded() {
  return { type: SETUP_BACKEND_SUCCEEDED }
}

export function setupBackend() {
  return { type: SETUP }
}

export function setupBackendFailed() {
  return { type: SETUP_BACKEND_FAILED }
}
