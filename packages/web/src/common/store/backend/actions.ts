export const SETUP = 'BACKEND/SETUP'
export const SETUP_BACKEND_SUCCEEDED = 'BACKEND/SETUP_BACKEND_SUCCEEDED'
export const SETUP_BACKEND_FAILED = 'BACKEND/SETUP_BACKEND_FAILED'

export function setupBackendSucceeded(web3Error: boolean) {
  return { type: SETUP_BACKEND_SUCCEEDED, web3Error }
}

export function setupBackend() {
  return { type: SETUP }
}

export function setupBackendFailed() {
  return { type: SETUP_BACKEND_FAILED }
}
