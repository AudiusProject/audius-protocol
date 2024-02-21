import { useCallback, useEffect, useMemo, useState } from 'react'

import { PlaybackSource, Status } from '@audius/common/models'
import type { ID, UID, Track, User } from '@audius/common/models'
import {
  cacheTracksSelectors,
  cacheUsersSelectors,
  savedPageTracksLineupActions as tracksActions,
  savedPageActions,
  savedPageSelectors,
  LibraryCategory,
  SavedPageTabs,
  reachabilitySelectors
} from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { debounce, isEqual } from 'lodash'
import Animated, { Layout } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'

import { Tile, VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { FilterInput } from 'app/components/filter-input'
import { TrackList } from 'app/components/track-list'
import type { TrackMetadata } from 'app/components/track-list/types'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { getIsDoneLoadingFromDisk } from 'app/store/offline-downloads/selectors'
import { makeStyles } from 'app/styles'

import { LoadingMoreSpinner } from './LoadingMoreSpinner'
import { NoTracksPlaceholder } from './NoTracksPlaceholder'
import { OfflineContentBanner } from './OfflineContentBanner'
import { useFavoritesLineup } from './useFavoritesLineup'

const { fetchSaves: fetchSavesAction, fetchMoreSaves } = savedPageActions
const {
  getTrackSaves,
  getSavedTracksStatus,
  getInitialFetchStatus,
  getSelectedCategoryLocalTrackAdds,
  getIsFetchingMore,
  getCategory
} = savedPageSelectors
const { getIsReachable } = reachabilitySelectors
const { getTrack } = cacheTracksSelectors
const { getUserFromTrack } = cacheUsersSelectors

const messages = {
  emptyTracksFavoritesText: "You haven't favorited any tracks yet.",
  emptyTracksRepostsText: "You haven't reposted any tracks yet.",
  emptyTracksPurchasedText: "You haven't purchased any tracks yet.",
  emptyTracksAllText:
    "You haven't favorited, reposted, or purchased any tracks yet.",
  inputPlaceholder: 'Filter Tracks'
}

const useStyles = makeStyles(({ spacing }) => ({
  container: {
    marginBottom: spacing(4),
    marginHorizontal: spacing(3)
  },
  trackList: {
    borderRadius: 8,
    overflow: 'hidden'
  },
  spinnerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing(12)
  }
}))

const FETCH_LIMIT = 50

export const TracksTab = () => {
  const dispatch = useDispatch()
  const styles = useStyles()
  const isReachable = useSelector(getIsReachable)

  const [filterValue, setFilterValue] = useState('')
  const [fetchPage, setFetchPage] = useState(0)
  const selectedCategory = useSelector((state) =>
    getCategory(state, { currentTab: SavedPageTabs.TRACKS })
  )
  const savedTracksStatus = useSelector((state) => {
    const onlineSavedTracksStatus = getSavedTracksStatus(state)
    const isDoneLoadingFromDisk = getIsDoneLoadingFromDisk(state)
    const offlineSavedTracksStatus = isDoneLoadingFromDisk
      ? Status.SUCCESS
      : Status.LOADING
    return isReachable ? onlineSavedTracksStatus : offlineSavedTracksStatus
  })

  const initialFetch = useSelector(getInitialFetchStatus)
  const isFetchingMore = useSelector(getIsFetchingMore)
  const saves = useSelector(getTrackSaves)
  const localAdditions = useSelector(getSelectedCategoryLocalTrackAdds)

  const saveCount = useMemo(
    () => saves.length + Object.keys(localAdditions).length,
    [saves, localAdditions]
  )

  const isLoading = savedTracksStatus !== Status.SUCCESS

  let emptyTabText: string
  if (selectedCategory === LibraryCategory.All) {
    emptyTabText = messages.emptyTracksAllText
  } else if (selectedCategory === LibraryCategory.Favorite) {
    emptyTabText = messages.emptyTracksFavoritesText
  } else if (selectedCategory === LibraryCategory.Repost) {
    emptyTabText = messages.emptyTracksRepostsText
  } else {
    emptyTabText = messages.emptyTracksPurchasedText
  }

  const fetchSaves = useCallback(() => {
    dispatch(
      fetchSavesAction(filterValue, selectedCategory, '', '', 0, FETCH_LIMIT)
    )
  }, [dispatch, filterValue, selectedCategory])

  useEffect(() => {
    // Need to fetch saves when the filterValue or selectedCategory (by way of fetchSaves) changes
    if (isReachable) {
      fetchSaves()
      setFetchPage((fetchPage) => fetchPage + 1)
    }
  }, [isReachable, fetchSaves])

  const { entries } = useFavoritesLineup(fetchSaves)
  const trackUids = useMemo(() => entries.map(({ uid }) => uid), [entries])

  const filterTrack = (
    track: Nullable<Track>,
    user: Nullable<User>
  ): track is TrackMetadata => {
    if (!track || !user) {
      return false
    }

    if (!filterValue.length) {
      return true
    }

    const matchValue = filterValue?.toLowerCase()
    return (
      track.title?.toLowerCase().indexOf(matchValue) > -1 ||
      user.name.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const allTracksFetched = useMemo(() => {
    return trackUids.length === saveCount && !filterValue
  }, [trackUids, saveCount, filterValue])

  const handleMoreFetchSaves = useCallback(() => {
    if (
      allTracksFetched ||
      isFetchingMore ||
      !isReachable ||
      trackUids.length < fetchPage * FETCH_LIMIT
    ) {
      return
    }

    const nextPage = fetchPage + 1
    dispatch(
      fetchMoreSaves(
        filterValue,
        selectedCategory,
        '',
        '',
        nextPage * FETCH_LIMIT,
        FETCH_LIMIT
      )
    )
    setFetchPage(nextPage)
  }, [
    allTracksFetched,
    selectedCategory,
    dispatch,
    fetchPage,
    filterValue,
    isFetchingMore,
    isReachable,
    trackUids.length
  ])

  const filteredTrackUids: string[] = useSelector((state) => {
    return trackUids.filter((uid) => {
      const track = getTrack(state, { uid })
      const user = getUserFromTrack(state, { uid })
      return filterTrack(track, user)
    })
  }, isEqual)

  const togglePlay = useCallback(
    (uid: UID, id: ID) => {
      dispatch(tracksActions.togglePlay(uid, id, PlaybackSource.LIBRARY_PAGE))
    },
    [dispatch]
  )

  const handleChangeFilterValue = useMemo(() => {
    return debounce(setFilterValue, 250)
  }, [])

  const loadingSpinner = <LoadingMoreSpinner />
  return (
    <VirtualizedScrollView>
      {!isLoading && filteredTrackUids.length === 0 && !filterValue ? (
        !isReachable ? (
          <NoTracksPlaceholder />
        ) : (
          <EmptyTileCTA message={emptyTabText} />
        )
      ) : (
        <>
          <OfflineContentBanner />
          <FilterInput
            placeholder={messages.inputPlaceholder}
            onChangeText={handleChangeFilterValue}
          />
          <WithLoader loading={initialFetch}>
            <Animated.View layout={Layout}>
              {filteredTrackUids.length ? (
                <Tile
                  styles={{
                    tile: styles.container
                  }}
                >
                  <TrackList
                    style={styles.trackList}
                    hideArt
                    onEndReached={handleMoreFetchSaves}
                    onEndReachedThreshold={1.5}
                    showDivider
                    togglePlay={togglePlay}
                    trackItemAction='overflow'
                    uids={filteredTrackUids}
                  />
                </Tile>
              ) : null}
              {isFetchingMore ? loadingSpinner : null}
            </Animated.View>
          </WithLoader>
        </>
      )}
    </VirtualizedScrollView>
  )
}
