import { getEagerDiscprov, makeEagerRequest } from '@audius/common/schemas'
/**
 * Utilities to assist in eager pre-fetching content from the
 * protocol before libs has initialized.
 */

import { env } from 'services/env'
import { localStorage } from 'services/local-storage'

export const LIBS_INITTED_EVENT = 'LIBS_INITTED_EVENT'

/**
 * Wait for the `LIBS_INITTED_EVENT` or pass through if there
 * already exists a mounted `window.audiusLibs` object.
 */
export const waitForLibsInit = async () => {
  // If libs is already defined, it has already loaded & initted
  // so do nothing
  if (window.audiusLibs) return
  // Add an event listener and resolve when that returns
  return new Promise((resolve) => {
    // @ts-ignore
    if (window.audiusLibs) resolve()
    window.addEventListener(LIBS_INITTED_EVENT, resolve)
  })
}

/**
 * Wraps a normal libs method call with method that calls the
 * provided eager variant if libs is not already loaded.
 * In the case the eager version returns an error, we wait for
 * libs to inititalize and then call the normal method.
 */
export const withEagerOption = async (
  {
    normal,
    eager,
    endpoint,
    requiresUser = false
  }: {
    normal: (libs: any) => any
    eager: (...args: any) => any
    endpoint?: string
    requiresUser?: boolean
  },
  ...args: any
) => {
  const disprovEndpoint =
    endpoint ?? (await getEagerDiscprov(localStorage, env))
  // @ts-ignore
  if (window.audiusLibs) {
    // @ts-ignore
    return normal(window.audiusLibs)(...args)
  } else {
    try {
      const req = eager(...args)
      const res = await makeEagerRequest(
        req,
        disprovEndpoint as string,
        requiresUser,
        localStorage,
        env
      )
      return res
    } catch (e) {
      await waitForLibsInit()
      // @ts-ignore
      return normal(window.audiusLibs)(...args)
    }
  }
}
