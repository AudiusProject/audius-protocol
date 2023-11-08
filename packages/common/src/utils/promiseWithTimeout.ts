export const promiseWithTimeout = (promise: Promise<any>, timeout: number) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Promise timed out'))
      }, timeout)
    })
  ])
}
