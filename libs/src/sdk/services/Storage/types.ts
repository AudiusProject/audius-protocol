import type { CrossPlatformFile as File } from '../../types/File'

export type StorageServiceConfig = {
  contentNodeEndpoint: string
}

export type ProgressCB = (loaded: number, total: number) => void

export type FileTemplate = 'audio' | 'img_square' | 'img_backdrop'

export type StorageService = {
  uploadFile({
    file,
    onProgress,
    template
  }: {
    file: File
    onProgress: ProgressCB
    template: FileTemplate
  }): Promise<any>
}

export type ProcessingStatus = 'new' | 'busy' | 'done' | 'error'
