/**
 * Given an array of promises, it returns the first resolved promise as soon as it finishes
 * @param promises
 * @param captureErrored optional capture errored promises
 * @return A promise that resolves with the first promise that resolves
 */
export async function promiseFight (promises: Promise<unknown>[], captureErrored = false) {
  let errored: unknown[] = []
  return Promise.all(promises.map(p => {
    return p.then(
      val => Promise.reject(val),
      err => {
        if (captureErrored) errored.push(err)
        return Promise.resolve(err)
      }
    )
  })).then(
    errors => Promise.reject(errors),
    val => {
      if (captureErrored) return Promise.resolve({ val, errored })
      else return Promise.resolve(val)
    }
  )
}