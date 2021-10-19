import { TrackMetadata } from 'common/models/Track'
import UploadType from 'containers/upload-page/components/uploadType'

interface UploadTrack {
  file: File
  preview: any // Basically the Howler.js API, but with underscores.
  metadata: TrackMetadata
}

interface ExtendedTrackMetadata extends TrackMetadata {
  artwork: {
    file: Blob
    url: string
  }
}

export enum ProgressStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE'
}

export type Progress = {
  status: ProgressStatus
  loaded: number
  total: number
}

export interface UploadPageState {
  openMultiTrackNotification: boolean
  tracks: UploadTrack[]
  metadata: ExtendedTrackMetadata
  uploadType: UploadType
  uploading: boolean
  uploadProgress: Progress[]
  success: boolean
  error: boolean
  completionId: number
  stems: TrackMetadata[]
}
