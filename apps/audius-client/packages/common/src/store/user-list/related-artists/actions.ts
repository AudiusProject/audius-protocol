import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../../models'

export const SET_RELATED_ARTISTS =
  'RELATED_ARTISTS_USER_PAGE/SET_RELATED_ARTISTS'
export const GET_RELATED_ARTISTS_ERROR =
  'RELATED_ARTISTS_USER_PAGE/GET_RELATED_ARTISTS_ERROR'

export const setRelatedArtists = createCustomAction(
  SET_RELATED_ARTISTS,
  (id: ID) => ({
    id
  })
)
export const getRelatedArtistsError = createCustomAction(
  GET_RELATED_ARTISTS_ERROR,
  (id: ID, error: string) => ({ id, error })
)
