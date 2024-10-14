import { useCallback, useRef } from 'react'

import { useFeatureFlag, useGatedContentAccess } from '@audius/common/hooks'
import { ID, LineupState, Track, User } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { trackPageLineupActions, QueueItem } from '@audius/common/store'
import { Box, Button, Flex, IconArrowRight, Text } from '@audius/harmony'
import { Link } from 'react-router-dom-v5-compat'

import { CommentSection } from 'components/comments/CommentSection'
import CoverPhoto from 'components/cover-photo/CoverPhoto'
import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import NavBanner from 'components/nav-banner/NavBanner'
import Page from 'components/page/Page'
import { StatBanner } from 'components/stat-banner/StatBanner'
import { GiantTrackTile } from 'components/track/GiantTrackTile'
import { TrackTileSize } from 'components/track/types'
import { getTrackDefaults, emptyStringGuard } from 'pages/track-page/utils'
import { trackRemixesPage } from 'utils/route'

import { TrackRemixes } from '../TrackRemixes'
import { useTrackPageSize } from '../useTrackPageSize'

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
  trendingBadgeLabel: string | null
  onHeroPlay: ({
    isPlaying,
    isPreview
  }: {
    isPlaying: boolean
    isPreview?: boolean
  }) => void
  goToAllRemixesPage: () => void
  onHeroShare: (trackId: ID) => void
  onHeroRepost: (isReposted: boolean, trackId: ID) => void
  onFollow: () => void
  onUnfollow: () => void
  onClickReposts: () => void
  onClickFavorites: () => void

  onSaveTrack: (isSaved: boolean, trackId: ID) => void
  makePublic: (trackId: ID) => void
  // Tracks Lineup Props
  tracks: LineupState<Track>
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
  trendingBadgeLabel,
  onHeroPlay,
  goToAllRemixesPage,
  onHeroShare,
  onHeroRepost,
  onSaveTrack,
  onFollow,
  onUnfollow,
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
  const isDesktop = useTrackPageSize()
  const { entries } = tracks
  const isOwner = heroTrack?.owner_id === userId
  const following = user?.does_current_user_follow ?? false
  const isSaved = heroTrack?.has_current_user_saved ?? false
  const isReposted = heroTrack?.has_current_user_reposted ?? false

  const { isFetchingNFTAccess, hasStreamAccess } =
    useGatedContentAccess(heroTrack)

  const { isEnabled: commentsFlagEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )
  const isCommentingEnabled =
    commentsFlagEnabled && !heroTrack?.comments_disabled
  const loading = !heroTrack || isFetchingNFTAccess

  const hasMoreByTracks = tracks?.entries?.length > 1 // note: the first in the list is always the track for this page

  const onPlay = () => onHeroPlay({ isPlaying: heroPlaying })
  const onPreview = () =>
    onHeroPlay({ isPlaying: heroPlaying, isPreview: true })

  const onSave = isOwner
    ? () => {}
    : () => heroTrack && onSaveTrack(isSaved, heroTrack.track_id)
  const onShare = () => (heroTrack ? onHeroShare(heroTrack.track_id) : null)
  const onRepost = () =>
    heroTrack ? onHeroRepost(isReposted, heroTrack.track_id) : null

  const commentSectionRef = useRef<HTMLDivElement | null>(null)

  const defaults = getTrackDefaults(heroTrack)

  const scrollToCommentSection = useCallback(() => {
    if (commentSectionRef.current) {
      commentSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [commentSectionRef])

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
      releaseDate={defaults.releaseDate}
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
      ddexApp={heroTrack?.ddex_app}
      isSaved={isSaved}
      trendingBadgeLabel={trendingBadgeLabel}
      isUnlisted={defaults.isUnlisted}
      isScheduledRelease={defaults.isScheduledRelease}
      isStreamGated={defaults.isStreamGated}
      streamConditions={defaults.streamConditions}
      isDownloadGated={defaults.isDownloadGated}
      downloadConditions={defaults.downloadConditions}
      hasStreamAccess={hasStreamAccess}
      isRemix={!!defaults.remixParentTrackId}
      isPublishing={defaults.isPublishing}
      fieldVisibility={defaults.fieldVisibility}
      coSign={defaults.coSign}
      scrollToCommentSection={scrollToCommentSection}
      // Actions
      onPlay={onPlay}
      onPreview={onPreview}
      onShare={onShare}
      onRepost={onRepost}
      onSave={onSave}
      following={following}
      onFollow={onFollow}
      onUnfollow={onUnfollow}
      onMakePublic={makePublic}
      onClickReposts={onClickReposts}
      onClickFavorites={onClickFavorites}
    />
  )

  const renderOriginalTrackTitle = () => (
    <Text color='default' variant='title' size='l'>
      {messages.originalTrack}
    </Text>
  )

  const renderMoreByTitle = () =>
    (defaults.remixParentTrackId && entries.length > 2) ||
    (!defaults.remixParentTrackId && entries.length > 1) ? (
      <Text
        color='default'
        variant='title'
        size='l'
      >{`${messages.moreBy} ${user?.name}`}</Text>
    ) : null

  const { fieldVisibility, remixTrackIds, permalink } = defaults

  const hasRemixes =
    fieldVisibility.remixes && remixTrackIds && remixTrackIds.length > 0

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
      <Box w='100%' css={{ position: 'absolute', height: '376px' }}>
        <CoverPhoto loading={loading} userId={user ? user.user_id : null} />
        <StatBanner isEmpty />
        <NavBanner empty />
      </Box>
      <Flex
        direction='column'
        css={{ position: 'relative', padding: '200px 16px 60px' }}
      >
        {renderGiantTrackTile()}
        {hasRemixes && !commentsFlagEnabled ? (
          <Flex justifyContent='center' mt='3xl' ph='l'>
            <Remixes
              trackIds={defaults.remixTrackIds!}
              goToAllRemixes={goToAllRemixesPage}
              count={defaults.remixesCount}
            />
          </Flex>
        ) : null}
        <Flex
          gap='2xl'
          w='100%'
          direction={isDesktop ? 'row' : 'column'}
          mt='3xl'
          mh='auto'
          css={{ maxWidth: 1080 }}
          justifyContent='center'
        >
          {isCommentingEnabled ? (
            <Flex flex='3'>
              <CommentSection
                entityId={defaults.trackId}
                commentSectionRef={commentSectionRef}
              />
            </Flex>
          ) : null}
          {hasRemixes || hasMoreByTracks ? (
            <Flex
              direction='column'
              alignItems={
                isCommentingEnabled && isDesktop ? 'flex-start' : 'center'
              }
              gap='l'
              flex={1}
              css={{
                minWidth: 330,
                maxWidth: isCommentingEnabled ? '100%' : '774px'
              }}
            >
              {hasRemixes ? <TrackRemixes trackId={defaults.trackId} /> : null}
              {hasValidRemixParent
                ? renderOriginalTrackTitle()
                : renderMoreByTitle()}
              <Lineup
                lineup={tracks}
                // Styles for leading element (original track if remix).
                leadingElementId={defaults.remixParentTrackId}
                leadingElementDelineator={
                  <Flex gap='3xl' direction='column'>
                    <Box
                      alignSelf={isCommentingEnabled ? 'flex-start' : 'center'}
                    >
                      <Button
                        size={isCommentingEnabled ? 'xs' : 'small'}
                        iconRight={IconArrowRight}
                        asChild
                      >
                        <Link to={trackRemixesPage(permalink)}>
                          {messages.viewOtherRemixes}
                        </Link>
                      </Button>
                    </Box>
                    <Flex
                      mb='l'
                      justifyContent={
                        isCommentingEnabled ? 'flex-start' : 'center'
                      }
                    >
                      {renderMoreByTitle()}
                    </Flex>
                  </Flex>
                }
                leadingElementTileProps={{ size: TrackTileSize.LARGE }}
                laggingContainerClassName={
                  !isCommentingEnabled
                    ? styles.moreByArtistContainer
                    : undefined
                }
                lineupContainerStyles={styles.width100}
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
                useSmallTiles={isCommentingEnabled}
              />
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </Page>
  )
}

export default TrackPage
