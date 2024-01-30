import { AudiusBackend } from '~/services/audius-backend'

export type TrackDownloadConfig = {
  audiusBackend: AudiusBackend
}

export class TrackDownload {
  audiusBackend: AudiusBackend

  constructor(config: TrackDownloadConfig) {
    this.audiusBackend = config.audiusBackend
  }

  async downloadTrack(_args: {
    url: string
    filename: string
    original?: boolean
  }) {
    throw new Error('downloadTrack not implemented')
  }
}
