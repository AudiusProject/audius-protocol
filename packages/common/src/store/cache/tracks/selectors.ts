import { QueryKey } from '@tanstack/react-query'

import { QUERY_KEYS, getTrackByPermalinkQueryKey } from '~/api'
import { getTrackQueryKey } from '~/api/tan-query/queryKeys'
import { CommonState } from '~/store/commonStore'

import { ID, UID, Track, StemTrack } from '../../../models'

/** @deprecated Use a tan-query equivalent instead. useTrack or queryClient.getQueryData */
export const getTrack = (
  state: CommonState,
  props: { id: ID | null } | { uid: UID | null } | { permalink: string | null }
): Track | undefined => {
  if ('permalink' in props) {
    const trackId = state.queryClient.getQueryData(
      getTrackByPermalinkQueryKey(props.permalink)
    )
    return state.queryClient.getQueryData(getTrackQueryKey(trackId))
  } else if ('uid' in props) {
    // TODO: figure the way to do uid lookup
  } else if ('id' in props) {
    return state.queryClient.getQueryData(getTrackQueryKey(props.id))
  }
  return undefined
}

/** @deprecated Use useTracks instead */
export const getTracks = (
  state: CommonState,
  props:
    | {
        ids: ID[] | null
      }
    | {
        uids: UID[] | null
      }
    | {
        permalinks: string[] | null
      }
    | undefined
) => {
  if (props && 'ids' in props) {
    return props.ids?.reduce(
      (acc, id) => {
        const track = getTrack(state, { id })
        if (track) {
          acc[id] = track
        }
        return acc
      },
      {} as { [id: number]: Track }
    )
  } else if (props && 'uids' in props) {
    return props.uids?.reduce(
      (acc, uid) => {
        const track = getTrack(state, { uid })
        if (track) {
          acc[uid] = track
        }
        return acc
      },
      {} as { [uid: string]: Track }
    )
  } else if (props && 'permalinks' in props) {
    return props.permalinks?.reduce(
      (acc, permalink) => {
        const track = getTrack(state, { permalink })
        if (track) {
          acc[permalink] = track
        }
        return acc
      },
      {} as { [permalink: string]: Track }
    )
  }
  // Returns all users in cache. TODO: this horribly inefficient dear god why on earth was this done
  const trackQueryResults = state.queryClient.getQueriesData({
    queryKey: [QUERY_KEYS.track]
  })
  return trackQueryResults.reduce((acc, queryData) => {
    const [, track] = queryData as [QueryKey, Track]
    if (track !== undefined) {
      return {
        ...acc,
        [track.track_id]: track
      }
    }
    return acc
  }, {})
}

export const getTracksByUid = (state: CommonState) => {
  return Object.keys(state.tracks.uids).reduce(
    (entries, uid) => {
      entries[uid] = getTrack(state, { uid })
      return entries
    },
    {} as { [uid: string]: Track | undefined }
  )
}

export const getStems = (state: CommonState, trackId?: ID) => {
  if (!trackId) return []

  const track = getTrack(state, { id: trackId })
  if (!track?._stems?.length) return []

  const stemIds = track._stems.map((s) => s.track_id)

  const stemsMap = getTracks(state, { ids: stemIds }) as {
    [id: number]: StemTrack
  }
  const stems = Object.values(stemsMap).filter(
    (t) => !t.is_delete && !t._marked_deleted
  )
  return stems
}
