import { Nullable } from 'utils/typeUtils'

export type CollectiblesMetadata = {
  [key: string]: object
  order: string[]
}

export enum CollectibleType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  GIF = 'GIF'
}

export type Collectible = {
  id: string
  name: Nullable<string>
  description: Nullable<string>
  type: CollectibleType
  imageUrl: Nullable<string>
  imagePreviewUrl: Nullable<string>
  imageThumbnailUrl: Nullable<string>
  imageOriginalUrl: Nullable<string>
  animationUrl: Nullable<string>
  animationOriginalUrl: Nullable<string>
  youtubeUrl: Nullable<string>
  isOwned: boolean
  dateCreated: Nullable<string>
  dateLastTransferred: Nullable<string>
  externalLink: Nullable<string>
}
