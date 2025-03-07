import { useEffect, useMemo } from 'react'

import { QueryKey, UseInfiniteQueryResult } from '@tanstack/react-query'
import { isEqual, partition } from 'lodash'
import { Selector, useDispatch, useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import {
  Collection,
  ID,
  Kind,
  LineupEntry,
  LineupState,
  LineupTrack,
  PlaybackSource,
  Status,
  Track,
  UID,
  UserCollectionMetadata,
  UserTrackMetadata,
  combineStatuses
} from '~/models'
import { CommonState } from '~/store/commonStore'
import { LineupActions } from '~/store/lineup/actions'
import { getPlaying } from '~/store/player/selectors'

import { useCollections } from '../useCollections'
import { useTracks } from '../useTracks'
import { useUsers } from '../useUsers'

import { combineQueryStatuses } from './combineQueryStatuses'
import { loadNextPage } from './infiniteQueryLoadNextPage'

/**
 * Helper to provide stitch together tan-query data and easily provide lineup methods as part of our query hooks
 */
export const useLineupQuery = ({
  queryData,
  queryKey,
  lineupActions,
  lineupSelector,
  playbackSource,
  pageSize
}: {
  // Lineup related props
  queryData: UseInfiniteQueryResult<UserTrackMetadata[]>
  queryKey: QueryKey
  lineupActions: LineupActions
  lineupSelector: Selector<
    CommonState,
    LineupState<LineupTrack | Track | Collection>
  >
  pageSize: number
  playbackSource: PlaybackSource
}) => {
  const lineup = useSelector(lineupSelector)

  const isPlaying = useSelector(getPlaying)
  const dispatch = useDispatch()
  // Lineup actions
  const togglePlay = (uid: UID, id: ID) => {
    dispatch(lineupActions.togglePlay(uid, id, playbackSource))
  }

  const play = (uid?: UID) => {
    dispatch(lineupActions.play(uid))
  }

  const pause = () => {
    dispatch(lineupActions.pause())
  }

  const updateLineupOrder = (orderedIds: UID[]) => {
    dispatch(lineupActions.updateLineupOrder(orderedIds))
  }

  const [lineupTrackIds, lineupCollectionIds] = useMemo(() => {
    const [tracks, collections] = partition(
      lineup.entries,
      (entry) => entry.kind === Kind.TRACKS
    )
    return [
      tracks.map((entry) => entry.id),
      collections.map((entry) => entry.id)
    ]
  }, [lineup.entries])

  const { byId: tracksById, ...tracksQuery } = useTracks(lineupTrackIds)
  const { byId: collectionsById, ...collectionsQuery } =
    useCollections(lineupCollectionIds)
  const userIds = useMemo(() => {
    const userIds = lineup.entries.map((entry) =>
      entry.kind === Kind.TRACKS
        ? tracksById[entry.id]?.owner_id
        : collectionsById[entry.id]?.playlist_owner_id
    )
    return userIds
  }, [lineup.entries, tracksById, collectionsById])
  const { byId: usersById } = useUsers(userIds)
  const entries = useMemo(() => {
    const newEntries = lineup.entries.map((entry) => {
      const entity =
        entry.kind === Kind.TRACKS
          ? tracksById[entry.id]
          : entry.kind === Kind.COLLECTIONS
            ? collectionsById[entry.id]
            : entry

      const userId =
        entry.kind === Kind.TRACKS
          ? tracksById[entry.id]?.owner_id
          : collectionsById[entry.id]?.playlist_owner_id

      const lineupEntry = {
        ...entry,
        ...entity
      } as LineupEntry<LineupTrack | UserTrackMetadata | UserCollectionMetadata>
      if (userId) {
        lineupEntry.user = usersById[userId]
      }
      return lineupEntry
    })
    return newEntries
  }, [lineup.entries, tracksById, collectionsById, usersById])

  const { data: tracksData } = tracksQuery
  const prevQueryKey = usePrevious(queryKey)
  const hasQueryKeyChanged = !isEqual(prevQueryKey, queryKey)
  // On a cache hit, we need to manually load the cached data into the lineup since the queryFn won't run.
  useEffect(() => {
    if (hasQueryKeyChanged) {
      dispatch(lineupActions.reset())
      // NOTE: This squashes all previously cached pages into the first page of the lineup.
      // This means the first page may have more entries than the pageSize.
      // If this causes issues we can slice the data back into pages, but this seems more inefficient.
      if (tracksData?.length && tracksData?.length > 0) {
        dispatch(
          lineupActions.fetchLineupMetadatas(0, tracksData.length, false, {
            tracks: tracksData
          })
        )
      }
    }
  }, [dispatch, lineupActions, tracksData, hasQueryKeyChanged])

  const combinedQueryStatus = combineQueryStatuses([
    queryData,
    tracksQuery,
    collectionsQuery
  ])

  const status = combineStatuses([
    combinedQueryStatus.isFetching ? Status.LOADING : Status.SUCCESS,
    lineup.status
  ])

  return {
    status,
    source: playbackSource,
    lineup: {
      ...lineup,
      entries,
      status,
      isMetadataLoading: status === Status.LOADING,
      hasMore: queryData.isLoading
        ? true
        : 'hasNextPage' in queryData
          ? queryData.hasNextPage
          : false
    },
    togglePlay,
    play,
    pause,
    updateLineupOrder,
    isPlaying,
    loadNextPage: loadNextPage(queryData)
  }
}

export type UseLineupQueryData = ReturnType<typeof useLineupQuery>
