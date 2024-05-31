export const delay = async (ms: number, options?: { signal: AbortSignal }) => {
  const signal = options?.signal
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'))
    }
    const listener = () => {
      clearTimeout(timer)
      reject(new Error('Timed out'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', listener)
      resolve()
    }, ms)
    signal?.addEventListener('abort', listener)
  })
}
