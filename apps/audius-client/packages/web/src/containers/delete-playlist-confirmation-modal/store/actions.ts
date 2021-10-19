import { createCustomAction } from 'typesafe-actions'

import { ID } from 'common/models/Identifiers'

export const SET_OPEN = 'DELETE_PLAYLIST_CONFIRMATION/SET_OPEN'
export const SET_CLOSED = 'DELETE_PLAYLIST_CONFIRMATION/SET_CLOSED'

export const setOpen = createCustomAction(SET_OPEN, (id: ID) => ({ id }))
export const setClosed = createCustomAction(SET_CLOSED, () => ({}))
