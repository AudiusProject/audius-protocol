/**
 * Utilities to assist in eager pre-fetching content from the
 * protocol before libs has initialized.
 */

import { getEagerDiscprov, makeEagerRequest } from '@audius/common'

import { env } from './env'
import { audiusLibs, waitForLibsInit } from './libs'
import { localStorage } from './local-storage'

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
  if (audiusLibs) {
    return normal(audiusLibs)(...args)
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
      return normal(audiusLibs)(...args)
    }
  }
}
