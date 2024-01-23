import importWorkerScript from 'workers/importWorkerScript'

import { env } from './env'

const importWorkScriptCode = importWorkerScript.toString()
const basename = env.BASENAME

export default class WebWorker {
  /**
   * Initializes a web worker for performing async tasks.
   * @param {file} workerFile The web worker code, which is turned into a string an exec'd.
   * @param {?boolean} terminateOnResult Whether or not to terminate the worker on gathering the result.
   * @param {?Array<file>} dependencies Optional array of file dependencies they worker needs
   * Note: Workers are non-trivial to spin up, so leaving commonly used workers running can be useful.
   */
  constructor(workerFile, terminateOnResult = true, dependencies = []) {
    const code = workerFile.toString()
    const dependencyCode = dependencies.map((d) => `${d.toString()};`).join()
    const blob = new Blob([
      `
      const basename = ${basename || "''"};
      ${dependencyCode};
      const importWorkerScript = ${importWorkScriptCode};
      const code = ${code};
      code();
    `
    ])
    this.worker = new Worker(URL.createObjectURL(blob))
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
