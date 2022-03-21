/**
 * Given an array of promises, it returns the first resolved promise as soon as it finishes
 * @param promises
 * @param captureErrored optional capture errored promises
 * @return A promise that resolves with the first promise that resolves
 */
export async function promiseFight<T,T2>(promises: Promise<T>[]): Promise<T | T2>;
export async function promiseFight<T,T2>(promises: Promise<T>[], captureErrored: boolean): Promise<{val: T, errored: T2[]}>
export async function promiseFight<T,T2>(promises: Promise<T>[], captureErrored?: boolean) {
  let errored: T2[] = []
  return Promise.all<Promise<T | T2>[]>(promises.map(p => {
    return p.then<T, T2>(
      val => Promise.reject(val),
      err => {
        if (captureErrored) errored.push(err)
        return Promise.resolve(err)
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
