import type { CrossPlatformFile as File } from '../../types/File'
import type { StorageNodeSelectorService } from '../StorageNodeSelector'

export type StorageServiceConfig = {
  storageNodeSelector: StorageNodeSelectorService
}

export type ProgressCB = (loaded: number, total: number) => void

export type FileTemplate = 'audio' | 'img_square' | 'img_backdrop'

export type StorageService = {
  uploadFile: ({
    file,
    onProgress,
    template,
    options
  }: {
    file: File
    onProgress?: ProgressCB
    template: FileTemplate
    options?: { [key: string]: string }
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
  probe: {
    format: {
      duration: string
    }
  }
}
