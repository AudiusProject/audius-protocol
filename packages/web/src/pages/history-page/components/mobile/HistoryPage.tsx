import { ID, UID, LineupTrack } from '@audius/common/models'

import { memo, useEffect, useCallback, useContext } from 'react'

import {} from '@audius/common'
import { useGatedContentAccessMap } from '@audius/common/hooks'
import { Button, ButtonType } from '@audius/stems'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/store/context'
import TrackList from 'components/track/mobile/TrackList'
import { TrackItemAction } from 'components/track/mobile/TrackListItem'
import { TRENDING_PAGE } from 'utils/route'

import styles from './HistoryPage.module.css'

const messages = {
  header: 'LISTENING HISTORY',
  empty: {
    primary: 'You haven’t listened to any tracks yet.',
    secondary: 'Once you have, this is where you’ll find them!',
    cta: 'Start Listening'
  }
}

export type HistoryPageProps = {
  title: string
  description: string
  userId: ID
  entries: LineupTrack[]
  playing: boolean
  isEmpty: boolean
  loading: boolean
  onTogglePlay: (uid: UID, trackId: ID) => void
  currentQueueItem: any
  goToRoute: (route: string) => void
}

const HistoryPage = ({
  title,
  description,
  entries,
  playing,
  isEmpty,
  loading,
  goToRoute,
  onTogglePlay,
  currentQueueItem
}: HistoryPageProps) => {
  // Set Header Nav
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(messages.header)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  const trackAccessMap = useGatedContentAccessMap(entries)

  const tracks = entries.map((track: LineupTrack, index: number) => {
    const isActive = track.uid === currentQueueItem.uid
    const { isFetchingNFTAccess, hasStreamAccess } = trackAccessMap[
      track.track_id
    ] ?? { isFetchingNFTAccess: false, hasStreamAccess: true }
    const isLocked = !isFetchingNFTAccess && !hasStreamAccess
    return {
      isLoading: loading,
      isStreamGated: track.is_stream_gated,
      isReposted: track.has_current_user_reposted,
      isSaved: track.has_current_user_saved,
      isActive,
      isPlaying: isActive && playing,
      artistName: track.user.name,
      artistHandle: track.user.handle,
      permalink: track.permalink,
      trackTitle: track.title,
      trackId: track.track_id,
      uid: track.uid,
      coverArtSizes: track._cover_art_sizes,
      isDeleted: track.is_delete || !!track.user.is_deactivated,
      isLocked
    }
  })

  const onClickEmpty = useCallback(() => {
    goToRoute(TRENDING_PAGE)
  }, [goToRoute])

  return (
    <MobilePageContainer title={title} description={description}>
      {isEmpty && !loading ? (
        <div className={styles.emptyContainer}>
          <div className={styles.primary}>
            {messages.empty.primary}
            <i className='emoji face-with-monocle' />
          </div>
          <div className={styles.secondary}>{messages.empty.secondary}</div>
          <Button
            type={ButtonType.SECONDARY}
            className={styles.btn}
            textClassName={styles.btnText}
            onClick={onClickEmpty}
            text={messages.empty.cta}
          />
        </div>
      ) : (
        <div className={styles.trackListContainer}>
          {loading ? (
            <LoadingSpinner className={styles.spinner} />
          ) : (
            <TrackList
              containerClassName={styles.containerClassName}
              tracks={tracks}
              itemClassName={styles.itemClassName}
              showDivider
              showBorder
              togglePlay={onTogglePlay}
              trackItemAction={TrackItemAction.Overflow}
            />
          )}
        </div>
      )}
    </MobilePageContainer>
  )
}

export default memo(HistoryPage)
