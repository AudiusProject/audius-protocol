import { useEffect, useContext } from 'react'

import { useFeatureFlag, useGatedContentAccess } from '@audius/common/hooks'
import { ID, Track, User } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { OverflowAction } from '@audius/common/store'
import { Flex } from '@audius/harmony'

import { CommentPreview } from 'components/comments/CommentPreview'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'components/nav/mobile/NavContext'
import { getTrackDefaults } from 'pages/track-page/utils'

import { TrackPageLineup } from '../TrackPageLineup'

import TrackPageHeader from './TrackHeader'

export type OwnProps = {
  title: string
  description: string
  canonicalUrl: string
  structuredData?: Object
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
  onHeroRepost: (isReposted: boolean, trackId: number) => void
  onClickMobileOverflow: (
    trackId: ID,
    overflowActions: OverflowAction[]
  ) => void

  onSaveTrack: (isSaved: boolean, trackId: ID) => void
  goToFavoritesPage: (trackId: ID) => void
  goToRepostsPage: (trackId: ID) => void
}

const TrackPage = ({
  title,
  description,
  canonicalUrl,
  structuredData,
  // Hero Track Props
  heroTrack,
  user,
  heroPlaying,
  previewing,
  userId,
  onHeroPlay,
  onHeroShare,
  onSaveTrack,
  onHeroRepost,
  onClickMobileOverflow,

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
        {isCommentingEnabled ? (
          <CommentPreview entityId={defaults.trackId} />
        ) : null}
        <TrackPageLineup
          user={user}
          trackId={defaults.trackId}
          commentsDisabled={heroTrack?.comments_disabled}
        />
      </Flex>
    </MobilePageContainer>
  )
}

export default TrackPage
