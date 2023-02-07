import { takeLatest, call } from 'typed-redux-saga'

import { purgeAllDownloads } from 'app/services/offline-downloader'

import { clearOfflineDownloads } from '../slice'

export function* clearOfflineDownloadsSaga() {
  yield* takeLatest(clearOfflineDownloads, clearOffineDownloadsAsync)
}

function* clearOffineDownloadsAsync() {
  yield* call(purgeAllDownloads)
}
