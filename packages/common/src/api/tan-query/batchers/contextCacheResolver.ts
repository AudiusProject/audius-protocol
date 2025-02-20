import { BatchContext } from './types'

/**
 * Utility to maintain a stable context for batcher memoization
 * @returns The previous context if it is effectively equal to the current context
 */
export const contextCacheResolver = () => {
  let lastContext: BatchContext | null = null

  return (context: BatchContext) => {
    if (
      lastContext &&
      Object.keys(context).every((key) =>
        Object.is(
          context[key as keyof BatchContext],
          lastContext?.[key as keyof BatchContext]
        )
      )
    ) {
      return lastContext
    }

    lastContext = context
    return context
  }
}
