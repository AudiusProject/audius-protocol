import { TrackMetadata } from '~/models'

import { Maybe } from './typeUtils'

export const isLongFormContent = (
  track: Maybe<Pick<TrackMetadata, 'genre'> | null>
) => track?.genre === 'Podcasts' || track?.genre === 'audiobook'
