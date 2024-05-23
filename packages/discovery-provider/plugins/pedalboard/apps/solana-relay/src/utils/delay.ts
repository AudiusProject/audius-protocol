export const delay = async (ms: number, options?: { signal: AbortSignal }) => {
    const signal = options?.signal
    return new Promise<void>((resolve, reject) => {
        if (signal?.aborted) {
            reject()
        }
        const listener = () => {
            clearTimeout(timer)
            reject()
        }
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', listener)
            resolve()
        }, ms)
        signal?.addEventListener('abort', listener)
    })
}
