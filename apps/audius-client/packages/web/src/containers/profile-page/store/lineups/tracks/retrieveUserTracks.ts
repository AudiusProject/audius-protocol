import { ID } from 'models/common/Identifiers'
import Track from 'models/Track'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { processAndCacheTracks } from 'store/cache/tracks/utils'

type RetrieveUserTracksArgs = {
  handle: string
  currentUserId: ID | null
  sort?: 'date' | 'plays'
  offset?: number
  limit?: number
}

export function* retrieveUserTracks({
  handle,
  currentUserId,
  sort,
  offset,
  limit
}: RetrieveUserTracksArgs): Generator<any, Track[], any> {
  const apiTracks = yield apiClient.getUserTracksByHandle({
    handle,
    currentUserId,
    sort,
    limit,
    offset
  })

  const processed: Track[] = yield processAndCacheTracks(apiTracks)
  return processed
}
