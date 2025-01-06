import { Dispatch } from 'redux'
import { AudiusBackend } from '~/services/audius-backend'

export type TrackDownloadConfig = {
  audiusBackend: AudiusBackend
}

export type DownloadFile = { url: string; filename: string }

export type DownloadTrackArgs = {
  files: DownloadFile[]
  rootDirectoryName?: string
  abortSignal?: AbortSignal
  dispatch: Dispatch
}

export class TrackDownload {
  audiusBackend: AudiusBackend

  constructor(config: TrackDownloadConfig) {
    this.audiusBackend = config.audiusBackend
  }

  /**
   * Download one or multiple tracks. rootDirectoryName must be supplied
   * if downloading multiple tracks.
   * Should be overridden by inheriting services/interfaces.
   */
  async downloadTracks(_args: DownloadTrackArgs) {
    throw new Error('downloadTrack not implemented')
  }
}
