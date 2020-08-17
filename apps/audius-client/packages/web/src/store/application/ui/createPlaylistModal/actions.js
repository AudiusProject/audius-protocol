export const OPEN = 'APPLICATION/UI/CREATE_PLAYLIST_MODAL/OPEN'
export const CLOSE = 'APPLICATION/UI/CREATE_PLAYLIST_MODAL/CLOSE'

export const open = collectionId => ({ type: OPEN, collectionId })
export const close = () => ({ type: CLOSE })
