import {
  push,
  goBack,
  goForward,
  replace,
  LOCATION_CHANGE
} from 'redux-first-history'
import type { RouterState } from 'redux-first-history'

// Re-export the actions and types for use throughout the app
export { push, goBack, goForward, replace, LOCATION_CHANGE }
export type { RouterState }

// Add any additional navigation utilities here if needed
