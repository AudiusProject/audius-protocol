import { useEffect, useContext } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { ID, LineupState, Track, User } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  trackPageLineupActions,
  OverflowAction,
  QueueItem
} from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'

import { CommentSection } from 'components/comments/CommentSection'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'components/nav/mobile/NavContext'
import SectionButton from 'components/section-button/SectionButton'
import { getTrackDefaults } from 'pages/track-page/utils'

import Remixes from './Remixes'
import TrackPageHeader from './TrackHeader'
const { tracksActions } = trackPageLineupActions

const messages = {
  moreBy: 'More By',
  originalTrack: 'Original Track',
  viewOtherRemixes: 'View Other Remixes'
}

export type OwnProps = {
  id: ID
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

const TrackPage = (props: OwnProps) => {
  const {
    id,
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
  } = props
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

  const { isEnabled: isCommentingEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

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
          id={id}
          isPlaying={heroPlaying}
          isPreviewing={previewing}
          commentCount={defaults.commentCount}
          commentsDisabled={defaults.commentsDisabled}
          // Actions (Wire up once we add backend integrations)
          onClickMobileOverflow={onClickMobileOverflow}
          onPlay={onPlay}
          onPreview={onPreview}
          onSave={onSave}
          onShare={onShare}
          onRepost={onRepost}
          goToFavoritesPage={goToFavoritesPage}
          goToRepostsPage={goToRepostsPage}
        />
        {defaults.fieldVisibility.remixes &&
          defaults.remixTrackIds &&
          defaults.remixTrackIds.length > 0 && (
            <Remixes
              trackIds={defaults.remixTrackIds}
              goToAllRemixes={goToAllRemixesPage}
              count={defaults.remixesCount}
            />
          )}
        {isCommentingEnabled ? (
          <CommentSection entityId={defaults.trackId} />
        ) : null}
        <Flex column gap='l'>
          {hasValidRemixParent
            ? renderOriginalTrackTitle()
            : renderMoreByTitle()}
          <Lineup
            lineup={tracks}
            // Styles for leading element (original track if remix).
            leadingElementId={defaults.remixParentTrackId}
            leadingElementDelineator={
              <div>
                <SectionButton
                  isMobile
                  text={messages.viewOtherRemixes}
                  onClick={goToParentRemixesPage}
                />
                {renderMoreByTitle()}
              </div>
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
