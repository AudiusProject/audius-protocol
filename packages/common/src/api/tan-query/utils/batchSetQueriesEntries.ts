import { QueryClient } from '@tanstack/react-query'

import { Kind } from '~/models/Kind'
import { EntriesByKind } from '~/store/cache/types'

import { getCollectionQueryKey } from '../useCollection'
import { getCollectionByPermalinkQueryKey } from '../useCollectionByPermalink'
import { getTrackQueryKey } from '../useTrack'
import { getTrackByPermalinkQueryKey } from '../useTrackByPermalink'
import { getUserQueryKey } from '../useUser'

import { batchSetQueriesData, QueryKeyValue } from './batchSetQueriesData'

export const batchSetQueriesEntries = ({
  entries,
  queryClient
}: {
  entries: EntriesByKind
  queryClient: QueryClient
}) => {
  const queryEntries: QueryKeyValue[] = Object.entries(entries).flatMap(
    ([kind, entries]) =>
      Object.entries(entries).flatMap(([id, entry]) => {
        const results: QueryKeyValue[] = []
        switch (kind) {
          case Kind.USERS:
            results.push({
              queryKey: getUserQueryKey(parseInt(id)),
              data: entry
            })
            break
          case Kind.TRACKS:
            results.push({
              queryKey: getTrackQueryKey(parseInt(id)),
              data: entry
            })
            if ('permalink' in entry) {
              results.push({
                queryKey: getTrackByPermalinkQueryKey(entry.permalink),
                data: entry
              })
            }
            break
          case Kind.COLLECTIONS:
            results.push({
              queryKey: getCollectionQueryKey(parseInt(id)),
              data: entry
            })
            if ('permalink' in entry) {
              results.push({
                queryKey: getCollectionByPermalinkQueryKey(entry.permalink),
                data: entry
              })
            }
            break
        }
        return results
      })
  )
  batchSetQueriesData(queryClient, queryEntries)
}
