import { primeCollectionDataInternal } from '../../api/tan-query/utils/primeCollectionData'
import { primeTrackDataInternal } from '../../api/tan-query/utils/primeTrackData'
import { primeUserDataInternal } from '../../api/tan-query/utils/primeUserData'
import type { CollectionMetadata } from '../../models/Collection'
import { Kind } from '../../models/Kind'
import type { Track } from '../../models/Track'
import type { User } from '../../models/User'

import type { EntriesByKind } from './types'
import { TypedQueryClient } from '~/api/tan-query/typed-query-client'

export const syncWithReactQuery = (
  queryClient: TypedQueryClient,
  entriesByKind: EntriesByKind
) => {
  // Process users first since tracks and collections may depend on them
  if (entriesByKind[Kind.USERS]) {
    primeUserDataInternal({
      users: Object.values(entriesByKind[Kind.USERS]) as User[],
      queryClient,
      forceReplace: true
    })
  }

  // Process tracks
  if (entriesByKind[Kind.TRACKS]) {
    primeTrackDataInternal({
      tracks: Object.values(entriesByKind[Kind.TRACKS]) as Track[],
      queryClient,
      forceReplace: true
    })
  }

  // Process collections
  if (entriesByKind[Kind.COLLECTIONS]) {
    primeCollectionDataInternal({
      collections: Object.values(
        entriesByKind[Kind.COLLECTIONS]
      ) as CollectionMetadata[],
      queryClient,
      forceReplace: true
    })
  }
}
