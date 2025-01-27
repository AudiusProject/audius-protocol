import { useCallback, useState } from 'react'

import { useLibraryTracks } from '@audius/common/api'
import { ID, UID, Status } from '@audius/common/models'
import {
  CommonState,
  SavedPageTabs,
  savedPageSelectors,
  LibraryCategory,
  lineupSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Paper, Text, IconFilter } from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { useTanQueryLineupProps } from 'components/lineup/hooks'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import TrackList from 'components/track/mobile/TrackList'
import { TrackItemAction } from 'components/track/mobile/TrackListItem'
import { useNavigateToPage } from 'hooks/useNavigateToPage'

import { emptyStateMessages } from '../emptyStateMessages'

import { EmptyTab } from './EmptyTab'
import styles from './SavedPage.module.css'
import { useTabContainerRef } from './hooks'

const { TRENDING_PAGE } = route
const { getTracksCategory, getSavedTracksLineup } = savedPageSelectors
const { makeGetTableMetadatas } = lineupSelectors

const selectTrackTableMetadatas = makeGetTableMetadatas(getSavedTracksLineup)

const messages = {
  filterTracks: 'Filter Tracks',
  noFilterResults: 'No tracks match your search'
}

export const TracksTabPage = () => {
  const navigate = useNavigateToPage()
  const goToTrending = useCallback(() => navigate(TRENDING_PAGE), [navigate])
  const [filterText, setFilterText] = useState('')

  const selectedCategory = useSelector(getTracksCategory)

  const { play, pause, isPlaying, status } = useLibraryTracks({
    category: selectedCategory,
    query: filterText
  })

  const { entries } = useSelector(selectTrackTableMetadatas)

  const lineupProps = useTanQueryLineupProps()
  const { playingUid } = lineupProps

  const trackList =
    entries.map((entry) => ({
      isLoading: false,
      isStreamGated: entry.is_stream_gated,
      isUnlisted: entry.is_unlisted,
      isSaved: entry.has_current_user_saved,
      isReposted: entry.has_current_user_reposted,
      isActive: playingUid === entry.uid,
      isPlaying: isPlaying && playingUid === entry.uid,
      artistName: entry.user.name,
      artistHandle: entry.user.handle,
      permalink: entry.permalink,
      trackTitle: entry.title,
      trackId: entry.track_id,
      uid: entry.uid,
      isDeleted: entry.is_delete || !!entry.user.is_deactivated,
      isLocked: false // TODO: Add gated content check
    })) ?? []

  const emptyTracksHeader = useSelector((state: CommonState) => {
    if (selectedCategory === LibraryCategory.All) {
      return emptyStateMessages.emptyTrackAllHeader
    } else if (selectedCategory === LibraryCategory.Favorite) {
      return emptyStateMessages.emptyTrackFavoritesHeader
    } else if (selectedCategory === LibraryCategory.Repost) {
      return emptyStateMessages.emptyTrackRepostsHeader
    } else {
      return emptyStateMessages.emptyTrackPurchasedHeader
    }
  })

  const contentRef = useTabContainerRef({
    resultsLength: trackList.length,
    hasNoResults: trackList.length === 0,
    currentTab: SavedPageTabs.TRACKS,
    isFilterActive: Boolean(filterText)
  })

  const isLoadingInitial =
    status === Status.LOADING && !filterText && !trackList.length
  const shouldHideFilterInput = isLoadingInitial && !filterText

  if (trackList.length === 0 && status !== Status.LOADING && !filterText) {
    return (
      <div className={styles.tracksLineupContainer}>
        <EmptyTab
          message={
            <>
              {emptyTracksHeader}
              <i className={cn('emoji', 'face-with-monocle', styles.emoji)} />
            </>
          }
          onClick={goToTrending}
        />
      </div>
    )
  }

  const handleTogglePlay = (uid: UID, trackId: ID) => {
    if (uid === playingUid) {
      if (isPlaying) {
        pause()
      } else {
        play()
      }
    } else {
      play(uid)
    }
  }

  return (
    <div className={styles.tracksLineupContainer}>
      <div ref={contentRef} className={styles.tabContainer}>
        {shouldHideFilterInput ? null : (
          <div className={styles.searchContainer}>
            <div className={styles.searchInnerContainer}>
              <input
                placeholder={messages.filterTracks}
                onChange={(e) => {
                  setFilterText(e.target.value)
                }}
                value={filterText}
              />
              <IconFilter className={styles.iconFilter} />
            </div>
          </div>
        )}
        {isLoadingInitial ? (
          <LoadingSpinner className={styles.spinner} />
        ) : null}
        {trackList.length > 0 ? (
          <div className={styles.trackListContainer}>
            <TrackList
              tracks={trackList}
              showDivider
              showBorder
              togglePlay={handleTogglePlay}
              trackItemAction={TrackItemAction.Overflow}
            />
          </div>
        ) : (
          <Paper p='2xl' m='m' justifyContent='center'>
            <Text>{messages.noFilterResults}</Text>
          </Paper>
        )}
      </div>
    </div>
  )
}
