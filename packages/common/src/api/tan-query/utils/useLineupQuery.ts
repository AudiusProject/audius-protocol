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
  combineStatuses
} from '~/models'
import { CommonState } from '~/store/commonStore'
import { LineupActions } from '~/store/lineup/actions'
import { getPlaying } from '~/store/player/selectors'

import { useCollections } from '../useCollections'
import { useTracks } from '../useTracks'

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

  const status = combineStatuses([
    queryData.isFetching ? Status.LOADING : Status.SUCCESS,
    lineup.status
  ])

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

  const { data: tracks } = useTracks(lineupTrackIds)
  const { data: collections } = useCollections(lineupCollectionIds)

  const entries: LineupEntry<LineupTrack | Track | Collection>[] =
    useMemo(() => {
      return lineup.entries.map((entry) => {
        const entity =
          entry.kind === Kind.TRACKS
            ? tracks?.find((track) => track.track_id === entry.id)
            : entry.kind === Kind.COLLECTIONS
              ? collections?.find(
                  (collection) => collection.playlist_id === entry.id
                )
              : entry
        return {
          ...entry,
          ...entity
        } as LineupEntry<LineupTrack | Track | Collection>
      })
    }, [lineup.entries, tracks, collections])

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
