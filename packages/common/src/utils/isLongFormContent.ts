import { TrackMetadata } from '~/models'

import { Maybe } from './typeUtils'

export const isLongFormContent = (
  track: Maybe<Pick<TrackMetadata, 'genre'> | null>
) => track?.genre === 'podcast' || track?.genre === 'audiobook'
