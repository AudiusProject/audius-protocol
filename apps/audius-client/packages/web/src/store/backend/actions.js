export const SETUP = 'BACKEND/SETUP'
export const SETUP_BACKEND_SUCCEEDED = 'BACKEND/SETUP_BACKEND_SUCCEEDED'
export const SETUP_BACKEND_FAILED = 'BACKEND/SETUP_BACKEND_FAILED'
export const LIBS_ERROR = 'BACKEND/LIBS_ERROR'

export function setupBackendSucceeded(web3Error) {
  return { type: SETUP_BACKEND_SUCCEEDED, web3Error }
}

export function setupBackend() {
  return { type: SETUP }
}

export function setupBackendFailed() {
  return { type: SETUP_BACKEND_FAILED }
}

export function libsError(error) {
  return { type: LIBS_ERROR, error }
}
