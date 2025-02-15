import isEqualWith from 'lodash-es/isEqualWith'

import { BatchContext } from './types'

/**
 * Utility to maintain a stable context for batcher memoization
 * @returns The previous context if it is effectively equal to the current context
 */
export const contextCacheResolver = () => {
  let lastContext: BatchContext | null = null

  return (context: BatchContext) => {
    if (isEqualWith(lastContext, context, Object.is)) {
      return lastContext
    }

    lastContext = context
    return context
  }
}
