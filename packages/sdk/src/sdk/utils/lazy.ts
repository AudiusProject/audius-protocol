/**
 * The public members of a class, without its private/protected fields.
 * Lets a facade `implements` a class type so the compiler flags any public
 * member the facade forgets to forward.
 */
export type PublicInterface<T> = { [K in keyof T]: T[K] }

export type LazyLoader<T> = {
  /** Loads the value on first call. Concurrent callers share one load. */
  get: () => Promise<T>
  /** The loaded value, or undefined if it hasn't finished loading. */
  peek: () => T | undefined
}

/**
 * Memoizes an async loader, typically a dynamic `import()` plus construction.
 * A failed load is not cached, so the next call tries again.
 */
export const createLazyLoader = <T>(load: () => Promise<T>): LazyLoader<T> => {
  let promise: Promise<T> | null = null
  let value: T | undefined
  return {
    get: () => {
      if (!promise) {
        promise = load().then(
          (v) => {
            value = v
            return v
          },
          (e) => {
            promise = null
            throw e
          }
        )
      }
      return promise
    },
    peek: () => value
  }
}
