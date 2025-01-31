import { useState } from 'react'

import { useLibraryTracks } from '@audius/common/api'
import { useThrottledCallback } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import {
  LibraryCategory,
  SavedPageTabs,
  queueSelectors,
  savedPageSelectors
} from '@audius/common/store'
import Animated, { Layout } from 'react-native-reanimated'
import { useSelector } from 'react-redux'

import { Tile, VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { FilterInput } from 'app/components/filter-input'
import { TrackList } from 'app/components/track-list'
import { makeStyles } from 'app/styles'

import { OfflineContentBanner } from './OfflineContentBanner'

const { getCategory } = savedPageSelectors
const { makeGetCurrent } = queueSelectors

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

export const TracksTab = () => {
  const styles = useStyles()
  const [filterValue, setFilterValue] = useState('')
  const selectedCategory = useSelector((state) =>
    getCategory(state, { currentTab: SavedPageTabs.TRACKS })
  )

  const { lineup, loadNextPage, play, pause, isPlaying, status } =
    useLibraryTracks({
      category: selectedCategory,
      query: filterValue
    })

  const currentQueueItem = useSelector(makeGetCurrent())
  const playingUid = currentQueueItem?.uid

  const handleChangeFilterValue = useThrottledCallback(
    (text: string) => {
      setFilterValue(text)
    },
    [],
    250
  )

  const isEmpty = lineup?.entries?.length === 0
  const isLoading = status === Status.LOADING

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

  return (
    <VirtualizedScrollView>
      {!isLoading && isEmpty && !filterValue ? (
        <EmptyTileCTA message={emptyTabText} />
      ) : (
        <>
          <OfflineContentBanner />
          <FilterInput
            placeholder={messages.inputPlaceholder}
            onChangeText={handleChangeFilterValue}
          />
          <Animated.View layout={Layout}>
            {!isEmpty ? (
              <Tile
                styles={{
                  tile: styles.container
                }}
              >
                <TrackList
                  style={styles.trackList}
                  hideArt
                  onEndReached={loadNextPage}
                  onEndReachedThreshold={1.5}
                  togglePlay={(uid) => {
                    if (uid === playingUid) {
                      if (isPlaying) {
                        pause()
                      } else {
                        play()
                      }
                    } else {
                      play(uid)
                    }
                  }}
                  trackItemAction='overflow'
                  uids={lineup.entries.map((entry) => entry.uid)}
                />
              </Tile>
            ) : null}
          </Animated.View>
        </>
      )}
    </VirtualizedScrollView>
  )
}
