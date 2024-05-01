import { useEffect, useContext } from 'react'

import {
  ID,
  LineupState,
  SquareSizes,
  Track,
  User
} from '@audius/common/models'
import { OverflowAction, QueueItem } from '@audius/common/store'

import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import { ServerMobilePageContainer } from 'components/mobile-page-container/ServerMobilePageContainer'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'components/nav/store/context'
import { getTrackDefaults } from 'pages/track-page/utils'
import { decodeHashId } from 'utils/hashIds'

import styles from '../../track-page/components/mobile/TrackPage.module.css'

import { ServerTrackPageHeader } from './ServerTrackPageHeader'

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

export const ServerTrackPage = ({
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
  onClickMobileOverflow
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

  // const { isFetchingNFTAccess, hasStreamAccess, hasDownloadAccess } =
  //   useGatedContentAccess(heroTrack)
  // const loading = !heroTrack || isFetchingNFTAccess
  const loading = false

  const defaults = getTrackDefaults(heroTrack)

  return (
    <ServerMobilePageContainer
      title={title}
      description={description}
      ogDescription={defaults.description}
      canonicalUrl={canonicalUrl}
      structuredData={structuredData}
      noIndex={defaults.isUnlisted}
    >
      <div className={styles.trackContent}>
        <ServerTrackPageHeader
          isLoading={loading}
          isPlaying={heroPlaying}
          isPreviewing={previewing}
          isReposted={isReposted}
          isFollowing={isFollowing}
          title={defaults.title}
          trackId={defaults.trackId}
          // @ts-ignore
          trackArtworkSrc={heroTrack?.artwork[SquareSizes.SIZE_480_BY_480]}
          userId={decodeHashId(heroTrack?.user.id) ?? 0}
          artistVerified={user?.is_verified ?? false}
          coverArtSizes={defaults.coverArtSizes}
          tags={defaults.tags}
          description={defaults.description}
          listenCount={defaults.playCount}
          repostCount={defaults.repostCount}
          duration={defaults.duration}
          released={defaults.released}
          credits={defaults.credits}
          genre={defaults.genre}
          mood={defaults.mood}
          saveCount={defaults.saveCount}
          isOwner={isOwner}
          isSaved={isSaved}
          coSign={defaults.coSign}
          // Actions (Wire up once we add backend integrations)
          onClickMobileOverflow={onClickMobileOverflow}
          onPlay={() => {}}
          onPreview={() => {}}
          onSave={() => {}}
          onShare={() => {}}
          onRepost={() => {}}
          isUnlisted={defaults.isUnlisted}
          isStreamGated={defaults.isStreamGated}
          streamConditions={defaults.streamConditions}
          // TODO: Check these two
          hasStreamAccess={true}
          hasDownloadAccess={true}
          // -------------------
          isRemix={!!defaults.remixParentTrackId}
          fieldVisibility={defaults.fieldVisibility}
          aiAttributedUserId={defaults.aiAttributionUserId}
          goToFavoritesPage={() => {}}
          goToRepostsPage={() => {}}
        />
      </div>
    </ServerMobilePageContainer>
  )
}
