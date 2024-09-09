import { TrackMetadata } from '~/models'

import { Maybe, Nullable } from './typeUtils'

export const isLongFormContent = (track: Maybe<Nullable<TrackMetadata>>) =>
  track?.genre === 'podcast' || track?.genre === 'audiobook'
