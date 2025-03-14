import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../../models'

import { RepostType } from './types'

export const SET_REPOST = 'REPOSTING_USER_PAGE/SET_REPOST'

export const setRepost = createCustomAction(
  SET_REPOST,
  (id: ID, repostType: RepostType) => ({ id, repostType })
)
