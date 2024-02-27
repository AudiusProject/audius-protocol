import { CollectionMetadata, TrackMetadata } from '../../models'
import { Nullable } from '../../utils/typeUtils'

export type NativeFile = {
  uri: string
  name: string | null
  copyError?: string
  fileCopyUri: string | null
  type: string | null
  size: number | null
}

export enum UploadType {
  INDIVIDUAL_TRACK = 0,
  INDIVIDUAL_TRACKS = 1,
  PLAYLIST = 2,
  ALBUM = 3
}

export interface UploadTrack {
  file: File | NativeFile
  preview: any // Basically the Howler.js API, but with underscores.
  metadata: ExtendedTrackMetadata
}

export interface ExtendedTrackMetadata extends TrackMetadata {
  artwork: Nullable<{
    file: Blob | NativeFile
    url: string
  }>
}

export interface ExtendedCollectionMetadata extends CollectionMetadata {
  playlist_name: string
  artwork: {
    file: Blob
    url: string
  }
}

export enum ProgressStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type Progress = {
  status: ProgressStatus
  loaded?: number
  total?: number
  transcode?: number
}

export type ProgressState = {
  art: Progress
  audio: Progress
}

export interface UploadState {
  openMultiTrackNotification: boolean
  tracks: Nullable<UploadTrack[]>
  metadata: Nullable<ExtendedCollectionMetadata>
  uploadType: Nullable<UploadType>
  uploading: boolean
  uploadProgress: Nullable<ProgressState[]>
  success: boolean
  error: boolean
  shouldReset: boolean
  completionId: Nullable<number>
  stems: TrackMetadata[]
  failedTrackIndices: number[]
}
