import { ID } from '@audius/common/models'
import {} from '@audius/common'
import { createCustomAction } from 'typesafe-actions'

export const SET_OPEN = 'UNFOLLOW_CONFIRMATION/SET_OPEN'
export const SET_CLOSED = 'UNFOLLOW_CONFIRMATION/SET_CLOSED'

export const setOpen = createCustomAction(SET_OPEN, (id: ID) => ({ id }))
export const setClosed = createCustomAction(SET_CLOSED, () => ({}))
