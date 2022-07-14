import { memo, useEffect, useContext } from 'react'

import { ID } from '@audius/common'

import { Collection, SmartCollection, Variant } from 'common/models/Collection'
import { SmartCollectionVariant } from 'common/models/SmartCollectionVariant'
import Status from 'common/models/Status'
import { User } from 'common/models/User'
import {
  CollectionsPageType,
  CollectionTrack
} from 'common/store/pages/collection/types'
import { OverflowAction } from 'common/store/ui/mobile-overflow-menu/types'
import CollectionHeader from 'components/collection/mobile/CollectionHeader'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'components/nav/store/context'
import NetworkConnectivityMonitor from 'components/network-connectivity/NetworkConnectivityMonitor'
import TrackList from 'components/track/mobile/TrackList'
import { computeCollectionMetadataProps } from 'pages/collection-page/store/utils'

import styles from './CollectionPage.module.css'

const messages = {
  emptyPlaylist: 'This playlist is empty.'
}

const EmptyTrackList = ({
  customEmptyText
}: {
  customEmptyText?: string | null
}) => {
  return (
    <div className={styles.emptyListContainer}>
      <div>{customEmptyText || messages.emptyPlaylist}</div>
    </div>
  )
}

export type CollectionPageProps = {
  title: string
  description: string
  canonicalUrl: string
  playlistId: ID | SmartCollectionVariant
  playing: boolean
  getPlayingUid: () => string | null
  type: CollectionsPageType
  collection: {
    status: string
    metadata: Collection | SmartCollection | null
    user: User | null
  }
  tracks: {
    status: string
    entries: CollectionTrack[]
  }
  userId?: ID | null
  userPlaylists?: any
  isQueued: () => boolean
  onHeroTrackClickArtistName: () => void
  onPlay: (record: any) => void
  onHeroTrackShare: () => void
  onHeroTrackSave?: () => void
  onHeroTrackRepost?: () => void
  onClickRow: (record: any) => void
  onClickSave?: (record: any) => void
  onClickMobileOverflow?: (
    collectionId: ID,
    overflowActions: OverflowAction[]
  ) => void
  onClickFavorites?: () => void
  onClickReposts?: () => void
  refresh?: () => void
}

const CollectionPage = ({
  title,
  description: pageDescription,
  canonicalUrl,
  playlistId,
  getPlayingUid,
  playing,
  type,
  collection: { status, metadata, user },
  tracks,
  userId,
  userPlaylists,
  isQueued,
  onHeroTrackClickArtistName,
  onPlay,
  onHeroTrackShare,
  onHeroTrackSave,
  onClickRow,
  onClickSave,
  onHeroTrackRepost,
  onClickMobileOverflow,
  onClickFavorites,
  onClickReposts,
  refresh
}: CollectionPageProps) => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    if (metadata) {
      // If the collection is deleted, don't update the nav
      if (
        metadata.variant !== Variant.SMART &&
        (metadata.is_delete || metadata._marked_deleted)
      ) {
        return
      }
      setLeft(LeftPreset.BACK)
      setRight(RightPreset.SEARCH)
      setCenter(CenterPreset.LOGO)
    }
  }, [setLeft, setCenter, setRight, metadata])

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(null)
  }, [setHeader])

  // TODO: Consider dynamic lineups, esp. for caching improvement.
  const collectionLoading = status === Status.LOADING
  const queuedAndPlaying = playing && isQueued()
  const tracksLoading = tracks.status === Status.LOADING

  const coverArtSizes =
    metadata && metadata?.variant !== Variant.SMART
      ? metadata._cover_art_sizes
      : null
  const duration =
    tracks.entries?.reduce(
      (duration: number, entry: CollectionTrack) =>
        duration + entry.duration || 0,
      0
    ) ?? 0

  const playlistOwnerName = user?.name ?? ''
  const playlistOwnerHandle = user?.handle ?? ''
  const playlistOwnerId = user?.user_id ?? null
  const isOwner = userId === playlistOwnerId

  const isSaved =
    metadata?.has_current_user_saved || playlistId in (userPlaylists ?? {})
  const isPublishing =
    metadata && metadata?.variant !== Variant.SMART
      ? metadata._is_publishing
      : false

  const variant = metadata?.variant ?? null
  const gradient =
    metadata && metadata.variant === Variant.SMART ? metadata.gradient : ''
  const imageOverride =
    metadata && metadata.variant === Variant.SMART ? metadata.imageOverride : ''
  const icon =
    metadata && metadata.variant === Variant.SMART ? metadata.icon : null
  const typeTitle =
    metadata?.variant === Variant.SMART ? metadata?.typeTitle ?? type : type
  const customEmptyText =
    metadata?.variant === Variant.SMART ? metadata?.customEmptyText : null

  const {
    isEmpty,
    lastModified,
    playlistName,
    description,
    isPrivate,
    isAlbum,
    playlistSaveCount,
    playlistRepostCount,
    isReposted
  } = computeCollectionMetadataProps(metadata)

  const togglePlay = (uid: string, trackId: ID) => {
    if (playlistId === SmartCollectionVariant.AUDIO_NFT_PLAYLIST) {
      const track = tracks.entries.find((track) => track.uid === uid)

      if (track?.collectible) {
        const { collectible } = track

        onClickRow({
          ...collectible,
          uid: collectible.id,
          track_id: collectible.id
        })
      }
    } else {
      onClickRow({ uid, track_id: trackId })
    }
  }
  const onSave = (isSaved: boolean, trackId: number) => {
    if (!isOwner) {
      onClickSave?.({ has_current_user_saved: isSaved, track_id: trackId })
    }
  }

  const playingUid = getPlayingUid()

  const trackList = tracks.entries.map((entry) => ({
    isLoading: false,
    isSaved: entry.has_current_user_saved,
    isReposted: entry.has_current_user_reposted,
    isActive: playingUid === entry.uid,
    isPlaying: queuedAndPlaying && playingUid === entry.uid,
    artistName: entry?.user?.name,
    artistHandle: entry?.user?.handle,
    trackTitle: entry.title,
    trackId: entry.track_id,
    uid: entry.uid,
    isDeleted: entry.is_delete || !!entry?.user?.is_deactivated
  }))

  return (
    <NetworkConnectivityMonitor
      pageDidLoad={tracksLoading}
      onDidRegainConnectivity={refresh}>
      <MobilePageContainer
        title={title}
        description={pageDescription}
        canonicalUrl={canonicalUrl}>
        <div className={styles.collectionContent}>
          <div>
            <CollectionHeader
              collectionId={playlistId}
              userId={user?.user_id ?? 0}
              loading={
                typeTitle === 'Audio NFT Playlist'
                  ? tracksLoading
                  : collectionLoading
              }
              tracksLoading={tracksLoading}
              type={typeTitle}
              title={playlistName}
              artistName={playlistOwnerName}
              artistHandle={playlistOwnerHandle}
              coverArtSizes={coverArtSizes}
              description={description}
              isOwner={isOwner}
              isAlbum={isAlbum}
              numTracks={trackList.length}
              modified={lastModified || Date.now()}
              duration={duration}
              isPublished={!isPrivate}
              isPublishing={isPublishing}
              isSaved={isSaved}
              saves={playlistSaveCount}
              playing={queuedAndPlaying}
              repostCount={playlistRepostCount}
              isReposted={isReposted}
              // Actions
              onClickArtistName={onHeroTrackClickArtistName}
              onPlay={onPlay}
              onShare={onHeroTrackShare}
              onSave={onHeroTrackSave}
              onRepost={onHeroTrackRepost}
              onClickFavorites={onClickFavorites}
              onClickReposts={onClickReposts}
              onClickMobileOverflow={onClickMobileOverflow}
              // Smart collection
              variant={variant}
              gradient={gradient}
              imageOverride={imageOverride}
              icon={icon}
            />
          </div>
          <div className={styles.collectionTracksContainer}>
            {!tracksLoading ? (
              isEmpty ? (
                <>
                  <div className={styles.divider}></div>
                  <EmptyTrackList customEmptyText={customEmptyText} />
                </>
              ) : (
                <TrackList
                  containerClassName={''}
                  itemClassName={''}
                  tracks={trackList}
                  showTopDivider
                  showDivider
                  onSave={onSave}
                  togglePlay={togglePlay}
                />
              )
            ) : null}
            {collectionLoading && typeTitle === 'Audio NFT Playlist' ? (
              <LoadingSpinner className={styles.spinner} />
            ) : null}
          </div>
        </div>
      </MobilePageContainer>
    </NetworkConnectivityMonitor>
  )
}

export default memo(CollectionPage)
