import { ID, Track } from '@audius/common/models'
import { getContext } from '@audius/common/store'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'

type RetrieveUserTracksArgs = {
  handle: string
  currentUserId: ID | null
  sort?: 'date' | 'plays'
  offset?: number
  limit?: number
  /**
   * This will only let a user obtain their own unlisted tracks, not
   * anyone's unlisted tracks. Prevention logic is in discovery node.
   */
  getUnlisted?: boolean
}

export function* retrieveUserTracks({
  handle,
  currentUserId,
  sort,
  offset,
  limit,
  getUnlisted = false
}: RetrieveUserTracksArgs): Generator<any, Track[], any> {
  const apiClient = yield* getContext('apiClient')
  const apiTracks = yield apiClient.getUserTracksByHandle({
    handle,
    currentUserId,
    sort,
    limit,
    offset,
    getUnlisted
  })

  const processed: Track[] = yield processAndCacheTracks(apiTracks)
  return processed
}
