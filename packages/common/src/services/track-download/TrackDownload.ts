import { AudiusBackend } from 'services/audius-backend'

export type TrackDownloadConfig = {
  audiusBackend: AudiusBackend
}

export class TrackDownload {
  audiusBackend: AudiusBackend

  constructor(config: TrackDownloadConfig) {
    this.audiusBackend = config.audiusBackend
  }

  async downloadTrack(_args: { url: string; filename: string }) {
    throw new Error('downloadTrack not implemented')
  }

  async downloadAll(_args: {
    files: { url: string; filename: string }[]
    zipFilename: string
  }) {
    throw new Error('downloadAll not implemented')
  }
}
