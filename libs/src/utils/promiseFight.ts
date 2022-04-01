/**
 * Given an array of promises, it returns the first resolved promise as soon as it finishes
 * @param promises
 * @param captureErrored optional capture errored promises
 * @return A promise that resolves with the first promise that resolves
 */
export async function promiseFight<T1, T2>(
  promises: Array<Promise<T1>>
): Promise<T1 | T2>
export async function promiseFight<T1, T2>(
  promises: Array<Promise<T1>>,
  captureErrored: boolean
): Promise<{ val: T1; errored: T2[] }>
export async function promiseFight<T1, T2>(
  promises: Array<Promise<T1>>,
  captureErrored?: boolean
) {
  const errored: T2[] = []
  return await Promise.all<Array<Promise<T1 | T2>>>(
    promises.map(async (p) => {
      return await p.then<T1, T2>(
        async (val) => await Promise.reject(val),
        async (err) => {
          if (captureErrored) errored.push(err)
          return await Promise.resolve(err)
        }
      )
    })
  ).then(
    async (errors) => await Promise.reject(errors),
    async (val) => {
      if (captureErrored) return await Promise.resolve({ val, errored })
      else return await Promise.resolve(val)
    }
  )
}
