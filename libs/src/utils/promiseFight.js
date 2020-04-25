/**
 * Given an array of promises, it returns the first resolved promise as soon as it finishes
 * @param {Array<Promise>} promises
 * @param {boolean?} captureErrored optional capture errored promises
 * @return {Promise<T>} A promise that resolves with the first promise that resolves
 */
async function promiseFight (promises, captureErrored = false) {
  let errored = []
  return Promise.all(promises.map(p => {
    return p.then(
      val => Promise.reject(val, errored),
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

module.exports = promiseFight
