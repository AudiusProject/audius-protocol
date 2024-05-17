export const promiseWithTimeout = <T>(
  promise: Promise<T>,
  timeout: number,
  options?: { rejectOnTimeout?: boolean }
) => {
  return Promise.race([
    promise,
    new Promise<null>((resolve, reject) => {
      setTimeout(() => {
        if (options?.rejectOnTimeout) {
          reject(new Error('Promise timed out'))
        } else {
          resolve(null)
        }
      }, timeout)
    })
  ])
}
