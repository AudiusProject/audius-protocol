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

/**
 * Represents a track file, its metadata prior to upload, and a preview.
 */
export interface TrackForUpload {
  file: File | NativeFile
  preview?: any // Basically the Howler.js API, but with underscores.
  metadata: TrackMetadataForUpload
}

export interface TrackForEdit {
  metadata: TrackMetadataForUpload
}

/**
 * Unlike normal Track metadata, TrackMetadataForUpload includes additional
 * files: artwork and a stems field with StemsForUpload.
 */
export interface TrackMetadataForUpload extends Omit<TrackMetadata, 'artwork'> {
  artwork?:
    | Nullable<{
        file?: Blob | NativeFile
        url: string
        source?: string
      }>
    | TrackMetadata['artwork']
  stems?: (StemUploadWithFile | StemUpload)[]
}
/**
 * Unlike normal CollectionMetadata, CollectionMetadataForUpload has artwork
 * and track details to be passed to its descendant tracks.
 */
export interface CollectionMetadataForUpload
  extends Omit<CollectionMetadata, 'artwork'> {
  artwork?:
    | Nullable<{
        file?: Blob | NativeFile
        url: string
        source?: string
      }>
    | CollectionMetadata['artwork']
  trackDetails: {
    genre: string
    mood: string
    tags: string
  }
}

export enum ProgressStatus {
  /** The file is being uploaded to the storage node. */
  UPLOADING = 'UPLOADING',
  /** The file is uploaded and being processed by the storage node. (Transcoding) */
  PROCESSING = 'PROCESSING',
  /** The upload is complete. */
  COMPLETE = 'COMPLETE',
  /** The upload failed. */
  ERROR = 'ERROR'
}

export type Progress = {
  /** The current status of the upload. */
  status: ProgressStatus
  /** Bytes currently uploaded. */
  loaded?: number
  /** Total number of bytes. */
  total?: number
  /** The transcoding progress, from [0, 1]. Used for audio files only. */
  transcode?: number
}

export type ProgressState = {
  /** The progress of the artwork upload. */
  art: Progress
  /** The progress of the audio track upload. */
  audio: Progress
  /** Nested progress for a track's stems (audio only). */
  stems: ProgressState[]
}

type UploadStateBase = {
  openMultiTrackNotification: boolean
  tracks: Nullable<TrackForUpload[]>
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

type UploadStateForTracks = UploadStateBase & {
  uploadType: UploadType.INDIVIDUAL_TRACK | UploadType.INDIVIDUAL_TRACKS | null
  completedEntity?: Track
}

type UploadStateForCollection = UploadStateBase & {
  uploadType: UploadType.ALBUM | UploadType.PLAYLIST | null
  completedEntity?: Collection
}

/** The type for the upload reducer state of the store. */
export type UploadState = UploadStateForCollection | UploadStateForTracks
