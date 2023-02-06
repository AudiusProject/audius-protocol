/**
 * Polyfill for Promise.any
 * Adapted from Sergio Tskhovrebov's implementation:
 * https://dev.to/sinxwal/looking-for-promise-any-let-s-quickly-implement-a-polyfill-for-it-1kga
 */
export const promiseAny = async <T>(
  iterable: Iterable<T | PromiseLike<T>>
): Promise<T> => {
  if ((Promise as any).any) {
    return (Promise as any).any(iterable)
  }
  return await Promise.all(
    [...iterable].map(
      async (promise) =>
        await new Promise((resolve, reject) => {
          Promise.resolve(promise).then(reject, resolve)
        })
    )
  ).then(
    async (errors) => await Promise.reject(errors),
    async (value) => await Promise.resolve<T>(value)
  )
}
