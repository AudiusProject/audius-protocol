import { createCustomAction } from 'typesafe-actions'

import { ID } from 'common/models/Identifiers'

import { RepostType } from './types'

export const SET_REPOST = 'REPOSTING_USER_PAGE/SET_REPOST'
export const GET_TRACK_REPOST_ERROR =
  'REPOSTING_USER_PAGE/GET_TRACK_REPOST_ERROR'
export const GET_PLAYLIST_REPOST_ERROR =
  'REPOSTING_USER_PAGE/GET_PLAYLIST_REPOST_ERROR'

export const setRepost = createCustomAction(
  SET_REPOST,
  (id: ID, repostType: RepostType) => ({ id, repostType })
)
export const trackRepostError = createCustomAction(
  GET_TRACK_REPOST_ERROR,
  (id: ID, error: string) => ({ id, error })
)
export const playlistRepostError = createCustomAction(
  GET_PLAYLIST_REPOST_ERROR,
  (id: ID, error: string) => ({ id, error })
)
