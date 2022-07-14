import { ID } from '@audius/common'

export type CreatePlaylistModalState = {
  isOpen: boolean
  collectionId: ID | null
  hideFolderTab: boolean
}
