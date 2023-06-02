import type { CrossPlatformFile as File } from '../../types/File'
import type { StorageNodeSelectorConfig } from '../StorageNodeSelector'

export type StorageServiceConfig = StorageNodeSelectorConfig

export type ProgressCB = (loaded: number, total: number) => void

export type FileTemplate = 'audio' | 'img_square' | 'img_backdrop'

export type StorageService = {
  uploadFile: ({
    file,
    onProgress,
    template
  }: {
    file: File
    onProgress?: ProgressCB
    template: FileTemplate
  }) => Promise<UploadResponse>
}

export type ProcessingStatus = 'new' | 'busy' | 'done' | 'error'

export type UploadResponse = {
  id: string
  status: ProcessingStatus
  results: {
    '320': string
  }
  probe: {
    format: {
      duration: string
    }
  }
}
