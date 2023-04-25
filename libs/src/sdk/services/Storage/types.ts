export type StorageServiceConfig = {
  contentNodeEndpoint: string
}

export type ProgressCB = (loaded: number, total: number) => void

export type FileTemplate = 'audio' | 'img_square' | 'img_backdrop'

export type StorageService = {
  uploadFile(
    file: File,
    onProgress: ProgressCB,
    template: FileTemplate
  ): Promise<any>
}
