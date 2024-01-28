import { AudiusBackend } from 'services/audius-backend'

export type TrackDownloadConfig = {
  audiusBackend: AudiusBackend
}

export type DownloadTrackArgs = {
  files: { url: string; filename: string }[]
  rootDirectoryName?: string
}

export class TrackDownload {
  audiusBackend: AudiusBackend

  constructor(config: TrackDownloadConfig) {
    this.audiusBackend = config.audiusBackend
  }

  /**
   * Download one or multiple tracks. rootDirectoryName must be supplied
   * if downloading multiple tracks.
   */
  async downloadTrack(_args: DownloadTrackArgs) {
    throw new Error('downloadTrack not implemented')
  }
}
