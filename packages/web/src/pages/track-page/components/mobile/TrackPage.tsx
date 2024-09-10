import { useEffect, useContext } from 'react'

import {
  useGetCurrentUserId,
  useGetTrackById,
  useGetUserById
} from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { ID, LineupState, Track } from '@audius/common/models'
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

  const { data: currentUserId } = useGetCurrentUserId({})
  const track = (useGetTrackById({ id, currentUserId }).data ??
    undefined) as unknown as Track | undefined
  const { data: user } = useGetUserById(
    { id: track?.owner_id ?? 0 },
    { disabled: !track?.owner_id }
  )

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
  const isOwner = track ? track.owner_id === userId : false
  const isSaved = track ? track.has_current_user_saved : false
  const isReposted = track ? track.has_current_user_reposted : false

  const { isEnabled: isCommentingEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const onPlay = () => onHeroPlay({ isPlaying: heroPlaying })
  const onPreview = () =>
    onHeroPlay({ isPlaying: heroPlaying, isPreview: true })
  const onSave = isOwner
    ? () => {}
    : () => track && onSaveTrack(isSaved, track.track_id)
  const onRepost = isOwner
    ? () => {}
    : () => track && onHeroRepost(isReposted, track.track_id)
  const onShare = () => {
    track && onHeroShare(track.track_id)
  }

  const {
    description: trackDescription,
    fieldVisibility,
    isUnlisted,
    remixesCount,
    remixParentTrackId,
    remixTrackIds,
    trackId
  } = getTrackDefaults(track ?? null)

  const renderOriginalTrackTitle = () => (
    <Text textAlign='left' variant='title'>
      {messages.originalTrack}
    </Text>
  )

  const renderMoreByTitle = () =>
    (remixParentTrackId && entries.length > 2) ||
    (!remixParentTrackId && entries.length > 1) ? (
      <Text variant='title' textAlign='left'>
        {messages.moreBy} {user?.name}
      </Text>
    ) : null

  return (
    <MobilePageContainer
      title={title}
      description={description}
      ogDescription={trackDescription}
      canonicalUrl={canonicalUrl}
      structuredData={structuredData}
      noIndex={isUnlisted}
    >
      <Flex column p='l' gap='2xl' w='100%'>
        <TrackPageHeader
          id={id}
          isPlaying={heroPlaying}
          isPreviewing={previewing}
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
        {fieldVisibility.remixes &&
          remixTrackIds &&
          remixTrackIds.length > 0 && (
            <Remixes
              trackIds={remixTrackIds}
              goToAllRemixes={goToAllRemixesPage}
              count={remixesCount}
            />
          )}
        {isCommentingEnabled ? <CommentSection entityId={trackId} /> : null}
        <Flex column gap='l'>
          {hasValidRemixParent
            ? renderOriginalTrackTitle()
            : renderMoreByTitle()}
          <Lineup
            lineup={tracks}
            // Styles for leading element (original track if remix).
            leadingElementId={remixParentTrackId}
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
