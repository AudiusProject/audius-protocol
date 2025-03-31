import { createCustomAction } from 'typesafe-actions'

import { ID } from '~/models/Identifiers'

export const SET_RELATED_ARTISTS =
  'RELATED_ARTISTS_USER_PAGE/SET_RELATED_ARTISTS'

export const setRelatedArtists = createCustomAction(
  SET_RELATED_ARTISTS,
  (id: ID) => ({
    id
  })
)
