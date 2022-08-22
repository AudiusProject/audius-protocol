import { ID } from '../../../models/Identifiers'
export const OPEN = 'APPLICATION/UI/CREATE_PLAYLIST_MODAL/OPEN'
export const CLOSE = 'APPLICATION/UI/CREATE_PLAYLIST_MODAL/CLOSE'

export const open = (collectionId?: ID, hideFolderTab = false) => ({
  type: OPEN,
  collectionId,
  hideFolderTab
})
export const close = () => ({ type: CLOSE })
