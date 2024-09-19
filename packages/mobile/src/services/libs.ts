import EventEmitter from 'events'

import type { Nullable } from '@audius/common/utils'
import type { AudiusLibs } from '@audius/sdk'

// TODO: declare this at the root and use actual audiusLibs type
declare global {
  interface Window {
    audiusLibs: AudiusLibs
  }
}

export const libsInitEventEmitter = new EventEmitter()

export let audiusLibs: Nullable<AudiusLibs> = null

export const LIBS_INITTED_EVENT = 'LIBS_INITTED_EVENT'

export const setLibs = (libs: Nullable<AudiusLibs>) => (audiusLibs = libs)

/**
 * Wait for the `LIBS_INITTED_EVENT` or pass through if there
 * already exists a mounted `window.audiusLibs` object.
 */
export const waitForLibsInit = async () => {
  // If libs is already defined, it has already loaded & initted
  // so do nothing
  if (audiusLibs) return
  // Add an event listener and resolve when that returns
  return new Promise<void>((resolve) => {
    if (audiusLibs) {
      resolve()
    } else {
      libsInitEventEmitter.addListener(LIBS_INITTED_EVENT, resolve)
    }
  })
}
