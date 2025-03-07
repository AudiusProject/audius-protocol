import { useMemo } from 'react'

import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { partition } from 'lodash'
import { Selector, useDispatch, useSelector } from 'react-redux'

import {
  LineupEntry,
  Collection,
  ID,
  Kind,
  LineupState,
  LineupTrack,
  PlaybackSource,
  Status,
  Track,
  UID,
  combineStatuses,
  UserTrackMetadata,
  UserCollectionMetadata
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
  lineupActions,
  lineupSelector,
  playbackSource
}: {
  // Lineup related props
  queryData: UseInfiniteQueryResult
  lineupActions: LineupActions
  lineupSelector: Selector<
    CommonState,
    LineupState<LineupTrack | Track | Collection>
  >
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
  const entries: LineupEntry<
    LineupTrack | UserTrackMetadata | UserCollectionMetadata
  >[] = useMemo(() => {
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
      hasMore: queryData.isLoading ? true : queryData.hasNextPage
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
