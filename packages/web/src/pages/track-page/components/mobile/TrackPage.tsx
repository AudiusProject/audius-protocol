import { useEffect, useContext } from 'react'

import { useFeatureFlag, useGatedContentAccess } from '@audius/common/hooks'
import { ID, LineupState, Track, User } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  trackPageLineupActions,
  OverflowAction,
  QueueItem
} from '@audius/common/store'
import { Box, Button, Flex, IconArrowRight, Text } from '@audius/harmony'
import { Link } from 'react-router-dom-v5-compat'

import { CommentPreview } from 'components/comments/CommentPreview'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'components/nav/mobile/NavContext'
import { getTrackDefaults } from 'pages/track-page/utils'
import { trackRemixesPage } from 'utils/route'

import { TrackRemixes } from '../TrackRemixes'

import Remixes from './Remixes'
import TrackPageHeader from './TrackHeader'
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
  hasValidRemixParent: boolean
  // Hero Track Props
  heroTrack: Track | null
  user: User | null
  heroPlaying: boolean
  previewing: boolean
  userId: ID | null
  onHeroPlay: ({
    isPlaying,
    isPreview
  }: {
    isPlaying: boolean
    isPreview?: boolean
  }) => void
  onHeroShare: (trackId: ID) => void
  goToAllRemixesPage: () => void
  goToParentRemixesPage: () => void
  onHeroRepost: (isReposted: boolean, trackId: number) => void
  onClickMobileOverflow: (
    trackId: ID,
    overflowActions: OverflowAction[]
  ) => void

  onSaveTrack: (isSaved: boolean, trackId: ID) => void
  // Tracks Lineup Props
  tracks: LineupState<Track>
  currentQueueItem: QueueItem
  isPlaying: boolean
  isBuffering: boolean
  play: (uid?: string) => void
  pause: () => void
  goToFavoritesPage: (trackId: ID) => void
  goToRepostsPage: (trackId: ID) => void
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
  onHeroPlay,
  onHeroShare,
  goToAllRemixesPage,
  goToParentRemixesPage,
  onSaveTrack,
  onHeroRepost,
  onClickMobileOverflow,

  // Tracks Lineup Props
  tracks,
  currentQueueItem,
  isPlaying,
  isBuffering,
  play,
  pause,
  goToFavoritesPage,
  goToRepostsPage
}: OwnProps) => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(CenterPreset.LOGO)
    setRight(RightPreset.SEARCH)
  }, [setLeft, setCenter, setRight])

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(null)
  }, [setHeader])

  const { entries } = tracks
  const isOwner = heroTrack ? heroTrack.owner_id === userId : false
  const isSaved = heroTrack ? heroTrack.has_current_user_saved : false
  const isReposted = heroTrack ? heroTrack.has_current_user_reposted : false
  const isFollowing = user ? user.does_current_user_follow : false

  const { isFetchingNFTAccess, hasStreamAccess, hasDownloadAccess } =
    useGatedContentAccess(heroTrack)

  const { isEnabled: commentsFlagEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )
  const isCommentingEnabled =
    commentsFlagEnabled && !heroTrack?.comments_disabled

  const loading = !heroTrack || isFetchingNFTAccess

  const onPlay = () => onHeroPlay({ isPlaying: heroPlaying })
  const onPreview = () =>
    onHeroPlay({ isPlaying: heroPlaying, isPreview: true })
  const onSave = isOwner
    ? () => {}
    : () => heroTrack && onSaveTrack(isSaved, heroTrack.track_id)
  const onRepost = isOwner
    ? () => {}
    : () => heroTrack && onHeroRepost(isReposted, heroTrack.track_id)
  const onShare = () => {
    heroTrack && onHeroShare(heroTrack.track_id)
  }

  const defaults = getTrackDefaults(heroTrack)
  const { fieldVisibility, remixTrackIds, permalink } = defaults

  const hasRemixes =
    fieldVisibility.remixes && remixTrackIds && remixTrackIds.length > 0

  const renderOriginalTrackTitle = () => (
    <Text textAlign='left' variant='title'>
      {messages.originalTrack}
    </Text>
  )

  const renderMoreByTitle = () =>
    (defaults.remixParentTrackId && entries.length > 2) ||
    (!defaults.remixParentTrackId && entries.length > 1) ? (
      <Text variant='title' textAlign='left'>
        {messages.moreBy} {user?.name}
      </Text>
    ) : null

  return (
    <MobilePageContainer
      title={title}
      description={description}
      ogDescription={defaults.description}
      canonicalUrl={canonicalUrl}
      structuredData={structuredData}
      noIndex={defaults.isUnlisted}
    >
      <Flex column p='l' gap='2xl' w='100%'>
        <TrackPageHeader
          isLoading={loading}
          isPlaying={heroPlaying}
          isPreviewing={previewing}
          isReposted={isReposted}
          isFollowing={isFollowing}
          title={defaults.title}
          trackId={defaults.trackId}
          userId={heroTrack?.owner_id ?? 0}
          coverArtSizes={defaults.coverArtSizes}
          tags={defaults.tags}
          description={defaults.description}
          listenCount={defaults.playCount}
          repostCount={defaults.repostCount}
          commentCount={defaults.commentCount}
          commentsDisabled={defaults.commentsDisabled}
          duration={defaults.duration}
          releaseDate={defaults.releaseDate}
          credits={defaults.credits}
          genre={defaults.genre}
          mood={defaults.mood}
          saveCount={defaults.saveCount}
          isOwner={isOwner}
          isSaved={isSaved}
          coSign={defaults.coSign}
          // Actions (Wire up once we add backend integrations)
          onClickMobileOverflow={onClickMobileOverflow}
          onPlay={onPlay}
          onPreview={onPreview}
          onSave={onSave}
          onShare={onShare}
          onRepost={onRepost}
          isUnlisted={defaults.isUnlisted}
          isStreamGated={defaults.isStreamGated}
          streamConditions={defaults.streamConditions}
          hasStreamAccess={hasStreamAccess}
          hasDownloadAccess={hasDownloadAccess}
          isRemix={!!defaults.remixParentTrackId}
          fieldVisibility={defaults.fieldVisibility}
          aiAttributedUserId={defaults.aiAttributionUserId}
          goToFavoritesPage={goToFavoritesPage}
          goToRepostsPage={goToRepostsPage}
        />
        {hasRemixes && !commentsFlagEnabled ? (
          <Remixes
            trackIds={defaults.remixTrackIds!}
            goToAllRemixes={goToAllRemixesPage}
            count={defaults.remixesCount}
          />
        ) : null}
        {isCommentingEnabled ? (
          <CommentPreview entityId={defaults.trackId} />
        ) : null}
        <Flex column gap='l'>
          {hasRemixes ? <TrackRemixes trackId={defaults.trackId} /> : null}
          {hasValidRemixParent
            ? renderOriginalTrackTitle()
            : renderMoreByTitle()}
          <Lineup
            lineup={tracks}
            // Styles for leading element (original track if remix).
            leadingElementId={defaults.remixParentTrackId}
            leadingElementDelineator={
              <Flex direction='column' gap='xl'>
                <Box alignSelf='flex-start'>
                  <Button size='xs' iconRight={IconArrowRight} asChild>
                    <Link to={trackRemixesPage(permalink)}>
                      {messages.viewOtherRemixes}
                    </Link>
                  </Button>
                </Box>
                {renderMoreByTitle()}
              </Flex>
            }
            showLeadingElementArtistPick={false}
            // Don't render the first tile in the lineup.
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
        </Flex>
      </Flex>
    </MobilePageContainer>
  )
}

export default TrackPage
