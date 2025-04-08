import { Dispatch } from 'redux'

export type DownloadFile = { url: string; filename: string }

export type DownloadTrackArgs = {
  files: DownloadFile[]
  rootDirectoryName?: string
  abortSignal?: AbortSignal
  dispatch: Dispatch
}

export type DownloadFileArgs = {
  file: DownloadFile
  mimeType?: string
  abortSignal?: AbortSignal
}

export class TrackDownload {
  /**
   * Download one or multiple tracks. rootDirectoryName must be supplied
   * if downloading multiple tracks.
   * Should be overridden by inheriting services/interfaces.
   */
  async downloadTracks(_args: DownloadTrackArgs) {
    throw new Error('downloadTrack not implemented')
  }

  /**
   * Used for generic download of a file without using sagas.
   * Should be overridden by inheriting services/interfaces.
   */
  async downloadFile(_args: DownloadFileArgs) {
    throw new Error('downloadFile not implemented')
  }
}
