import { ID } from '../../../models/Identifiers'

export type CreatePlaylistModalState = {
  isOpen: boolean
  collectionId: ID | null
  hideFolderTab: boolean
}
