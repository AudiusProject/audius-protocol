import { PayloadAction } from '@reduxjs/toolkit'

import { ShareSource } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { Track } from 'common/models/Track'

export type ShareModalState = {
  track?: Track
  source?: ShareSource
}

export type RequestOpenAction = PayloadAction<{
  trackId: ID
  source: ShareSource
}>

export type OpenAction = PayloadAction<{
  track: Track
  source: ShareSource
}>
