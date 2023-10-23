import importWorkerScript from 'workers/importWorkerScript'

const importWorkScriptCode = importWorkerScript.toString()

export default class WebWorker {
  /**
   * Initializes a web worker for performing async tasks.
   * @param {file} workerFile The web worker code, which is turned into a string an exec'd.
   * @param {?boolean} terminateOnResult Whether or not to terminate the worker on gathering the result.
   * Note: Workers are non-trivial to spin up, so leaving commonly used workers running can be useful.
   */
  constructor(workerFile, terminateOnResult = true) {
    const code = workerFile.toString()
    const blob = new Blob([
      `
      const basename = ${import.meta.env.PUBLIC_URL}
      const importWorkerScript = ${importWorkScriptCode}
      const code = ${code}
      code()
    `
    ])
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(URL.createObjectURL(blob))
    }
    this.terminateOnResult = terminateOnResult
  }

  /**
   * @param {object} params the actual parameters to pass to the worker script
   * @param {?string} key optional key to use to retrieve specific values when the worker is handling
   * multiple requests.
   */
  call = (params, key = '') => {
    this.worker.postMessage(JSON.stringify({ ...params, key }))
  }

  /**
   * @param {?string} key optional key used to retrieve specifically keyed calls.
   */
  getResult = async (key = '') => {
    return new Promise((resolve, reject) => {
      this.worker.addEventListener('message', (event) => {
        if (event.data.key) {
          if (event.data.key === key) {
            resolve(event.data.result)
          }
        } else {
          resolve(event.data)
        }
        if (this.terminateOnResult) {
          this.worker.terminate()
        }
      })
    })
  }
}
