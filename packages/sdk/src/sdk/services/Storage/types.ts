import type { CrossPlatformFile as File } from '../../types/File'
import type { AudiusWalletClient } from '../AudiusWalletClient'
import type { LoggerService } from '../Logger'
import type { StorageNodeSelectorService } from '../StorageNodeSelector'

export type StorageServiceConfigInternal = {
  /**
   * Logger service, defaults to console
   */
  logger: LoggerService
}

export type StorageServiceConfig = Partial<StorageServiceConfigInternal> & {
  /**
   * The StorageNodeSelector service used to get the relevant storage node for content
   */
  storageNodeSelector: StorageNodeSelectorService
  audiusWalletClient: AudiusWalletClient
}

export type ProgressCB = (loaded: number, total: number) => void

export type FileTemplate = 'audio' | 'img_square' | 'img_backdrop'

export type StorageService = {
  uploadFile: ({
    file,
    onProgress,
    template,
    options,
    auth
  }: {
    file: File
    onProgress?: ProgressCB
    template: FileTemplate
    options?: { [key: string]: string }
    auth: AudiusWalletClient
  }) => Promise<UploadResponse>
  editFile: ({
    uploadId,
    data,
    auth
  }: {
    uploadId: string
    data: { [key: string]: string }
    auth: AudiusWalletClient
  }) => Promise<UploadResponse>
}

export type ProcessingStatus =
  | 'new'
  | 'busy'
  | 'done'
  | 'error'
  | 'retranscode_preview'
  | 'busy_retranscode_preview'
  | 'error_retranscode_preview'

export type UploadResponse = {
  id: string
  status: ProcessingStatus
  results: {
    [key: string]: string
  }
  orig_file_cid: string
  orig_filename: string
  audio_analysis_error_count: number
  audio_analysis_results?: {
    [key: string]: string
  }
  probe: {
    format: {
      duration: string
    }
  }
}
