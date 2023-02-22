import { call, retry } from 'typed-redux-saga'

import { OfflineDownloadStatus } from '../../slice'

export function* retryOfflineJob<
  Fn extends (...args: any[]) => Generator<any, OfflineDownloadStatus>
>(maxTries: number, delayLength: number, fn: Fn, ...args: Parameters<Fn>) {
  function* fnWrapped(...args: Parameters<Fn>) {
    const returnValue = yield* call(fn, ...args)
    if (returnValue === OfflineDownloadStatus.ERROR) {
      throw new Error(returnValue)
    }
    return returnValue
  }

  try {
    return yield* retry(maxTries, delayLength, fnWrapped, ...args)
  } catch (e) {
    if (e.message === OfflineDownloadStatus.ERROR)
      return OfflineDownloadStatus.ERROR
    throw e
  }
}
