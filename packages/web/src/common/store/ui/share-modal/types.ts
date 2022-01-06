import { PayloadAction } from '@reduxjs/toolkit'

import { ID } from 'common/models/Identifiers'
import { Track } from 'common/models/Track'

export type ShareModalState = {
  track?: Track
}

export type RequestOpenAction = PayloadAction<{
  trackId: ID
}>

export type OpenAction = PayloadAction<{
  track: Track
}>
