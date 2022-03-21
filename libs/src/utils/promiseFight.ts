/**
 * Given an array of promises, it returns the first resolved promise as soon as it finishes
 * @param promises
 * @param captureErrored optional capture errored promises
 * @return A promise that resolves with the first promise that resolves
 */
export async function promiseFight (promises: Array<Promise<unknown>>, captureErrored = false) {
  const errored: unknown[] = []
  return await Promise.all(promises.map(async p => {
    return await p.then(
      async val => await Promise.reject(val),
      async err => {
        if (captureErrored) errored.push(err)
        return await Promise.resolve(err)
      }
    )
  })).then(
    async errors => await Promise.reject(errors),
    async val => {
      if (captureErrored) return await Promise.resolve({ val, errored })
      else return await Promise.resolve(val)
    }
  )
}
