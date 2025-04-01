import { useEffect } from 'react'

import { EntityType } from '@audius/sdk'
import {
  QueryKey,
  UseInfiniteQueryResult,
  useQueryClient
} from '@tanstack/react-query'
import { isEqual } from 'lodash'
import { Selector, useDispatch, useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import { getCollectionQueryKey, getTrackQueryKey } from '~/api'
import { useAudiusQueryContext } from '~/audius-query'
import {
  Collection,
  Feature,
  ID,
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

import { TQCollection } from '../models'
import { LineupData } from '../types'

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
  queryData: UseInfiniteQueryResult<LineupData>
  queryKey: QueryKey
  lineupActions: LineupActions
  lineupSelector: Selector<
    CommonState,
    LineupState<LineupTrack | Track | Collection>
  >
  pageSize: number
  playbackSource: PlaybackSource
}) => {
  const { reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
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

  const { data: lineupData } = queryData
  const prevQueryKey = usePrevious(queryKey)
  const hasQueryKeyChanged = !isEqual(prevQueryKey, queryKey)

  // On a cache hit, we need to manually load the cached data into the lineup since the queryFn won't run.
  useEffect(() => {
    if (hasQueryKeyChanged) {
      dispatch(lineupActions.reset())
      // NOTE: This squashes all previously cached pages into the first page of the lineup.
      // This means the first page may have more entries than the pageSize.
      // If this causes issues we can slice the data back into pages, but this seems more inefficient.
      if (lineupData?.length) {
        // The TQ cache for lineups only stores data in ID form, but our legacy lineup logic requires full entries.
        // Here we take the ids and retrieve full entities from the tq cache
        // There should never be a cache miss here because
        const fullLineupItems = lineupData
          ?.map((item) => {
            if (item.type === EntityType.TRACK) {
              const track = queryClient.getQueryData<Track>(
                getTrackQueryKey(item.id)
              )
              if (!track) {
                reportToSentry({
                  feature: Feature.TanQuery,
                  error: new Error(
                    `Missing cache entry for track from ${lineup.prefix} lineup. Missing id: ${item.id}`
                  )
                })
                return undefined
              } else {
                return track
              }
            } else {
              const collection = queryClient.getQueryData<TQCollection>(
                getCollectionQueryKey(item.id)
              )
              if (!collection) {
                reportToSentry({
                  feature: Feature.TanQuery,
                  error: new Error(
                    `Missing cache entry for collection from ${lineup.prefix} lineup. Missing id: ${item.id}`
                  )
                })
                return undefined
              } else {
                return collection
              }
            }
          })
          .filter(Boolean)
        // Put the full entities in the lineup
        dispatch(
          lineupActions.fetchLineupMetadatas(0, lineupData.length, false, {
            items: fullLineupItems
          })
        )
      }
    }
  }, [
    dispatch,
    lineupActions,
    lineupData,
    hasQueryKeyChanged,
    queryClient,
    lineup.prefix,
    reportToSentry
  ])

  const status = combineStatuses([
    queryData.isFetching ? Status.LOADING : Status.SUCCESS,
    lineup.status
  ])

  return {
    status,
    source: playbackSource,
    lineup: {
      ...lineup,
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
    pageSize,
    // pass through specific queryData props
    //   this avoids spreading all queryData props which causes extra renders
    loadNextPage: loadNextPage(queryData),
    data: queryData.data,
    isInitialLoading: queryData.isInitialLoading,
    hasNextPage: queryData.hasNextPage,
    isLoading: queryData.isLoading,
    isPending: queryData.isPending,
    isError: queryData.isError,
    isFetching: queryData.isFetching,
    isSuccess: queryData.isSuccess
  }
}

export type UseLineupQueryData = ReturnType<typeof useLineupQuery>
