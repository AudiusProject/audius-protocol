import { ID, Track, User } from '@audius/common/models'
import { useSelector } from 'react-redux'

import ServerCoverPhoto from 'components/cover-photo/ServerCoverPhoto'
import NavBanner from 'components/nav-banner/NavBanner'
import { ServerPage } from 'components/page/ServerPage'
import { ServerStatBanner } from 'components/stat-banner/ServerStatBanner'
import { ServerGiantTrackTile } from 'components/track/ServerGiantTrackTile'
import { getTrackDefaults, emptyStringGuard } from 'pages/track-page/utils'
import { AppState } from 'store/types'
import { decodeHashId } from 'utils/hashIds'

import styles from '../../track-page/components/desktop/TrackPage.module.css'

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
}

export const ServerTrackPage = ({
  title,
  description,
  canonicalUrl,
  structuredData,
  // Hero Track Props
  heroTrack,
  user,
  userId,
  badge
}: OwnProps) => {
  // @ts-ignore
  const trackId = decodeHashId(heroTrack.id)
  const track = useSelector(
    (state: AppState) => state.tracks.entries[trackId as ID].metadata
  )
  // @ts-ignore:
  const trackOwner = track?.user

  const isOwner = track?.owner_id === userId
  const following = user?.does_current_user_follow ?? false
  const isSaved = track?.has_current_user_saved ?? false
  const isReposted = track?.has_current_user_reposted ?? false

  const defaults = getTrackDefaults(track)

  const renderGiantTrackTile = () => (
    <ServerGiantTrackTile
      loading={false}
      playing={false}
      previewing={false}
      trackTitle={defaults.title}
      trackId={defaults.trackId}
      aiAttributionUserId={defaults.aiAttributionUserId}
      userId={trackOwner?.user_id ?? 0}
      artistHandle={emptyStringGuard(trackOwner?.handle)}
      coverArtSizes={defaults.coverArtSizes}
      // @ts-ignore
      overrideArtwork={heroTrack.artwork['1000x1000']}
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
        track && trackOwner
          ? trackOwner.artist_pick_track_id === track.track_id
          : false
      }
      ddexApp={track?.ddex_app}
      isSaved={isSaved}
      badge={badge}
      isUnlisted={defaults.isUnlisted}
      isScheduledRelease={defaults.isScheduledRelease}
      isStreamGated={defaults.isStreamGated}
      streamConditions={defaults.streamConditions}
      isDownloadGated={defaults.isDownloadGated}
      downloadConditions={defaults.downloadConditions}
      // TODO: fix this
      // hasStreamAccess={hasStreamAccess}
      hasStreamAccess={true}
      isRemix={!!defaults.remixParentTrackId}
      isPublishing={defaults.isPublishing}
      fieldVisibility={defaults.fieldVisibility}
      coSign={defaults.coSign}
      // Actions
      onPlay={() => {}}
      onPreview={() => {}}
      onShare={() => {}}
      onRepost={() => {}}
      onSave={() => {}}
      following={following}
      onFollow={() => {}}
      onUnfollow={() => {}}
      onMakePublic={() => {}}
      onClickReposts={() => {}}
      onClickFavorites={() => {}}
    />
  )

  return (
    <ServerPage
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
        <ServerCoverPhoto userId={trackOwner ? trackOwner.user_id : null} />
        <ServerStatBanner isEmpty />
        <NavBanner empty />
      </div>
      <div className={styles.contentWrapper}>{renderGiantTrackTile()}</div>
    </ServerPage>
  )
}
