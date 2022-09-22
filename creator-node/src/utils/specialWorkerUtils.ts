const cluster = require('cluster')

/**
 * Some tasks are only done on one worker, which is determined by this util. Those tasks are:
 * - listen for state machine jobs to complete and run onComplete callbacks
 */
class SpecialWorkerUtils {
  private _specialWorkerId = 1
  get specialWorkerId(): number {
    return this._specialWorkerId
  }

  set specialWorkerId(specialWorkerId: number) {
    this._specialWorkerId = specialWorkerId
  }

  isThisProcessSpecial() {
    return cluster.worker?.id === this._specialWorkerId
  }
}
const specialWorkerUtils = new SpecialWorkerUtils()
export { specialWorkerUtils }
