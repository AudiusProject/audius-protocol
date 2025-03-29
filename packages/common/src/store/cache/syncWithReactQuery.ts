import { TQCollection, TQTrack } from '~/api/tan-query/models'
import { TypedQueryClient } from '~/api/tan-query/typed-query-client'
import { User } from '~/models/User'

import { getCollectionQueryKey } from '../../api/tan-query/useCollection'
import { getTrackQueryKey } from '../../api/tan-query/useTrack'
import { getUserQueryKey } from '../../api/tan-query/useUser'
import { Kind } from '../../models/Kind'

import type { EntriesByKind } from './types'

export const syncWithReactQuery = (
  queryClient: TypedQueryClient,
  entriesByKind: EntriesByKind
) => {
  Object.entries(entriesByKind).forEach(([kind, entries]) => {
    if (!entries) return
    Object.entries(entries).forEach(([id, entry]) => {
      const parsedId = parseInt(id, 10)
      switch (kind as Kind) {
        case Kind.USERS:
          queryClient.setQueryData(getUserQueryKey(parsedId), entry as User)
          break
        case Kind.TRACKS:
          queryClient.setQueryData(getTrackQueryKey(parsedId), entry as TQTrack)
          break
        case Kind.COLLECTIONS:
          queryClient.setQueryData(
            getCollectionQueryKey(parsedId),
            entry as TQCollection
          )
          break
      }
    })
  })
}
