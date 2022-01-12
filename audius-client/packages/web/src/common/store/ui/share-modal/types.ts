import { PayloadAction } from '@reduxjs/toolkit'

import { ShareSource } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'
import { Nullable } from 'common/utils/typeUtils'

export type ShareType = 'track' | 'profile'

type ShareTrackContent = Nullable<{
  type: 'track'
  track: Track
  artist: User
}>

type ShareProfileContent = Nullable<{
  type: 'profile'
  profile: User
}>

export type ShareModalState = {
  source: Nullable<ShareSource>
  content: Nullable<ShareTrackContent | ShareProfileContent>
}

type RequestOpenPayload = { source: ShareSource } & (
  | { type: 'track'; trackId: ID }
  | { type: 'profile'; profileId: ID }
)

export type RequestOpenAction = PayloadAction<RequestOpenPayload>

type OpenPayload = { source: ShareSource } & (
  | { type: 'track'; track: Track; artist: User }
  | { type: 'profile'; profile: User }
)

export type OpenAction = PayloadAction<OpenPayload>
