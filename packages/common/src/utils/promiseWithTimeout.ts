export const promiseWithTimeout = (
  promise: Promise<any>,
  timeout: number,
  options?: { rejectOnTimeout?: boolean }
) => {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
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
