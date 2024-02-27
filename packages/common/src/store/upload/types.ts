import { CollectionValues } from '~/schemas'

import {
  Collection,
  CollectionMetadata,
  StemUpload,
  StemUploadWithFile,
  Track,
  TrackMetadata
} from '../../models'
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
  preview?: any // Basically the Howler.js API, but with underscores.
  metadata: ExtendedTrackMetadata
}

export interface ExtendedTrackMetadata extends TrackMetadata {
  artwork: Nullable<{
    file: Blob | NativeFile
    url: string
  }>
  stems?: StemUploadWithFile[]
}

export interface ExtendedCollectionMetadata extends CollectionMetadata {
  playlist_name: string
  artwork: {
    file: Blob
    url: string
  }
  trackDetails: {
    genre: string
    mood: string
    tags: string
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
  stems: ProgressState[]
}

type UploadStateBase = {
  openMultiTrackNotification: boolean
  tracks: Nullable<UploadTrack[]>
  metadata: Nullable<CollectionValues>
  uploading: boolean
  uploadProgress: Nullable<ProgressState[]>
  success: boolean
  error: boolean
  shouldReset: boolean
  completionId: Nullable<number>
  stems: StemUpload[][]
  failedTrackIndices: number[]
}

export type UploadState =
  | (UploadStateBase & {
      uploadType:
        | UploadType.INDIVIDUAL_TRACK
        | UploadType.INDIVIDUAL_TRACKS
        | null
      completedEntity?: Track
    })
  | (UploadStateBase & {
      uploadType: UploadType.ALBUM | UploadType.PLAYLIST | null
      completedEntity?: Collection
    })
