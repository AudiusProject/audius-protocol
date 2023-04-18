import { EntityState } from '@reduxjs/toolkit'

import { ID, Status } from 'models'

export type RelatedArtists = {
  artistId: ID
  relatedArtistIds: ID[]
  isTopArtistsRecommendation: boolean
  status: Status
}

export type RelatedArtistsState = EntityState<RelatedArtists>
