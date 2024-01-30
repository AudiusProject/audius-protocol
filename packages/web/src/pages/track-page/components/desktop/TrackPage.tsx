import {
  ID,
  LineupState,
  Track,
  User,
  trackPageLineupActions,
  QueueItem,
  useGatedContentAccess
} from '@audius/common'
import cn from 'classnames'

import CoverPhoto from 'components/cover-photo/CoverPhoto'
import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import NavBanner from 'components/nav-banner/NavBanner'
import Page from 'components/page/Page'
import SectionButton from 'components/section-button/SectionButton'
import { StatBanner } from 'components/stat-banner/StatBanner'
import { GiantTrackTile } from 'components/track/GiantTrackTile'
import { TrackTileSize } from 'components/track/types'
import { getTrackDefaults, emptyStringGuard } from 'pages/track-page/utils'

import Remixes from './Remixes'
import styles from './TrackPage.module.css'

const { tracksActions } = trackPageLineupActions

const messages = {
  moreBy: 'More By',
  originalTrack: 'Original Track',
  viewOtherRemixes: 'View Other Remixes'
}

export type OwnProps = {
  title: string
  description: string
  canonicalUrl: string
  structuredData?: Object
  // Hero Track Props
  heroTrack: Track | null
  hasValidRemixParent: boolean
  user: User | null
  heroPlaying: boolean
  previewing: boolean
  userId: ID | null
  badge: string | null
  onHeroPlay: ({
    isPlaying,
    isPreview
  }: {
    isPlaying: boolean
    isPreview?: boolean
  }) => void
  goToAllRemixesPage: () => void
  goToParentRemixesPage: () => void
  onHeroShare: (trackId: ID) => void
  onHeroRepost: (isReposted: boolean, trackId: ID) => void
  onFollow: () => void
  onUnfollow: () => void
  onClickReposts: () => void
  onClickFavorites: () => void

  onSaveTrack: (isSaved: boolean, trackId: ID) => void
  makePublic: (trackId: ID) => void
  onDownloadTrack: ({
    trackId,
    category,
    parentTrackId
  }: {
    trackId: ID
    category?: string
    parentTrackId?: ID
  }) => void
  // Tracks Lineup Props
  tracks: LineupState<{ id: ID }>
  currentQueueItem: QueueItem
  isPlaying: boolean
  isBuffering: boolean
  play: (uid?: string) => void
  pause: () => void
}

const TrackPage = ({
  title,
  description,
  canonicalUrl,
  structuredData,
  hasValidRemixParent,
  // Hero Track Props
  heroTrack,
  user,
  heroPlaying,
  previewing,
  userId,
  badge,
  onHeroPlay,
  goToAllRemixesPage,
  goToParentRemixesPage,
  onHeroShare,
  onHeroRepost,
  onSaveTrack,
  onFollow,
  onUnfollow,
  onDownloadTrack,
  makePublic,
  onClickReposts,
  onClickFavorites,

  // Tracks Lineup Props
  tracks,
  currentQueueItem,
  isPlaying,
  isBuffering,
  play,
  pause
}: OwnProps) => {
  const { entries } = tracks
  const isOwner = heroTrack?.owner_id === userId
  const following = user?.does_current_user_follow ?? false
  const isSaved = heroTrack?.has_current_user_saved ?? false
  const isReposted = heroTrack?.has_current_user_reposted ?? false

  const { isFetchingNFTAccess, hasStreamAccess, hasDownloadAccess } =
    useGatedContentAccess(heroTrack)
  const loading = !heroTrack || isFetchingNFTAccess

  const onPlay = () => onHeroPlay({ isPlaying: heroPlaying })
  const onPreview = () =>
    onHeroPlay({ isPlaying: heroPlaying, isPreview: true })

  const onSave = isOwner
    ? () => {}
    : () => heroTrack && onSaveTrack(isSaved, heroTrack.track_id)
  const onShare = () => (heroTrack ? onHeroShare(heroTrack.track_id) : null)
  const onRepost = () =>
    heroTrack ? onHeroRepost(isReposted, heroTrack.track_id) : null

  const defaults = getTrackDefaults(heroTrack)

  const renderGiantTrackTile = () => (
    <GiantTrackTile
      loading={loading}
      playing={heroPlaying}
      previewing={previewing}
      trackTitle={defaults.title}
      trackId={defaults.trackId}
      aiAttributionUserId={defaults.aiAttributionUserId}
      userId={user?.user_id ?? 0}
      artistHandle={emptyStringGuard(user?.handle)}
      coverArtSizes={defaults.coverArtSizes}
      tags={defaults.tags}
      description={defaults.description}
      listenCount={defaults.playCount}
      duration={defaults.duration}
      released={defaults.released}
      credits={defaults.credits}
      genre={defaults.genre}
      mood={defaults.mood}
      repostCount={defaults.repostCount}
      saveCount={defaults.saveCount}
      isReposted={isReposted}
      isOwner={isOwner}
      currentUserId={userId}
      isArtistPick={
        heroTrack && user
          ? user.artist_pick_track_id === heroTrack.track_id
          : false
      }
      isSaved={isSaved}
      badge={badge}
      isUnlisted={defaults.isUnlisted}
      isScheduledRelease={defaults.isScheduledRelease}
      isStreamGated={defaults.isStreamGated}
      streamConditions={defaults.streamConditions}
      isDownloadGated={defaults.isDownloadGated}
      downloadConditions={defaults.downloadConditions}
      hasStreamAccess={hasStreamAccess}
      hasDownloadAccess={hasDownloadAccess}
      isRemix={!!defaults.remixParentTrackId}
      isPublishing={defaults.isPublishing}
      fieldVisibility={defaults.fieldVisibility}
      coSign={defaults.coSign}
      // Actions
      onPlay={onPlay}
      onPreview={onPreview}
      onShare={onShare}
      onRepost={onRepost}
      onSave={onSave}
      following={following}
      onFollow={onFollow}
      onUnfollow={onUnfollow}
      onDownload={onDownloadTrack}
      onMakePublic={makePublic}
      onClickReposts={onClickReposts}
      onClickFavorites={onClickFavorites}
    />
  )

  const renderOriginalTrackTitle = () => (
    <div className={cn(styles.lineupHeader, styles.large)}>
      {messages.originalTrack}
    </div>
  )

  const renderMoreByTitle = () =>
    (defaults.remixParentTrackId && entries.length > 2) ||
    (!defaults.remixParentTrackId && entries.length > 1) ? (
      <div
        className={styles.lineupHeader}
      >{`${messages.moreBy} ${user?.name}`}</div>
    ) : null

  return (
    <Page
      title={title}
      description={description}
      ogDescription={defaults.description}
      canonicalUrl={canonicalUrl}
      structuredData={structuredData}
      variant='flush'
      scrollableSearch
      fromOpacity={1}
      noIndex={defaults.isUnlisted}
    >
      <div className={styles.headerWrapper}>
        <CoverPhoto loading={loading} userId={user ? user.user_id : null} />
        <StatBanner isEmpty />
        <NavBanner empty />
      </div>
      <div className={styles.contentWrapper}>{renderGiantTrackTile()}</div>
      {defaults.fieldVisibility.remixes &&
        defaults.remixTrackIds &&
        defaults.remixTrackIds.length > 0 && (
          <div className={styles.remixes}>
            <Remixes
              trackIds={defaults.remixTrackIds}
              goToAllRemixes={goToAllRemixesPage}
              count={defaults.remixesCount}
            />
          </div>
        )}
      <div className={styles.moreByArtistLineupWrapper}>
        {hasValidRemixParent ? renderOriginalTrackTitle() : renderMoreByTitle()}
        <Lineup
          lineup={tracks}
          // Styles for leading element (original track if remix).
          leadingElementId={defaults.remixParentTrackId}
          leadingElementDelineator={
            <div className={styles.originalTrackDelineator}>
              <SectionButton
                text={messages.viewOtherRemixes}
                onClick={goToParentRemixesPage}
              />
              {renderMoreByTitle()}
            </div>
          }
          leadingElementTileProps={{ size: TrackTileSize.LARGE }}
          laggingContainerClassName={styles.moreByArtistContainer}
          leadingElementClassName={styles.originalTrack}
          showLeadingElementArtistPick={false}
          applyLeadingElementStylesToSkeleton
          // Don't render the first tile in the lineup since it's actually the "giant"
          // track tile this page is about.
          start={1}
          // Show max 5 loading tiles
          count={6}
          // Managed from the parent rather than allowing the lineup to fetch content itself.
          selfLoad={false}
          variant={LineupVariant.CONDENSED}
          playingUid={currentQueueItem.uid}
          playingSource={currentQueueItem.source}
          playingTrackId={
            currentQueueItem.track && currentQueueItem.track.track_id
          }
          playing={isPlaying}
          buffering={isBuffering}
          playTrack={play}
          pauseTrack={pause}
          actions={tracksActions}
        />
      </div>
    </Page>
  )
}

export default TrackPage
