import {
  ID,
  CoverArtSizes,
  FieldVisibility,
  Remix,
  AccessConditions
} from '@audius/common/models'
import { CommonState } from '@audius/common/store'
import { Text, Flex, IconRobot } from '@audius/harmony'
import cn from 'classnames'
import { shallowEqual, useSelector } from 'react-redux'

import { ServerUserLink } from 'components/link/ServerUserLink'
import RepostFavoritesStats from 'components/repost-favorites-stats/RepostFavoritesStats'
import { ScheduledReleaseGiantLabel } from 'components/scheduled-release-label/ScheduledReleaseLabel'
import Skeleton from 'components/skeleton/Skeleton'
import { Tile } from 'components/tile'
import { ServerUserGeneratedText } from 'components/user-generated-text/ServerUserGeneratedText'
import { moodMap } from 'utils/Moods'
import { formatDate, formatSeconds } from 'utils/dateUtils'

import Badge from './Badge'
import { CardTitle } from './CardTitle'
import styles from './GiantTrackTile.module.css'
import InfoLabel from './InfoLabel'
import { ServerGiantArtwork } from './ServerGiantArtwork'

const messages = {
  makePublic: 'MAKE PUBLIC',
  releaseNow: 'RELEASE NOW',
  isPublishing: 'PUBLISHING',
  repostButtonText: 'repost',
  repostedButtonText: 'reposted',
  unplayed: 'Unplayed',
  timeLeft: 'left',
  played: 'Played',
  generatedWithAi: 'Generated With AI',
  actionGroupLabel: 'track actions'
}

export type ServerGiantTrackTileProps = {
  aiAttributionUserId: number | null
  artistHandle: string
  badge: string | null
  coSign: Remix | null
  coverArtSizes: CoverArtSizes | null
  credits: string
  currentUserId: ID | null
  description: string
  hasStreamAccess: boolean
  duration: number
  fieldVisibility: FieldVisibility
  following: boolean
  genre: string
  isArtistPick: boolean
  isOwner: boolean
  isStreamGated: boolean
  isDownloadGated: boolean
  isPublishing: boolean
  isRemix: boolean
  isReposted: boolean
  isSaved: boolean
  isUnlisted: boolean
  isScheduledRelease: boolean
  listenCount: number
  loading: boolean
  mood: string
  onClickFavorites: () => void
  onClickReposts: () => void
  onMakePublic: (trackId: ID) => void
  onFollow: () => void
  onPlay: () => void
  onPreview: () => void
  onRepost: () => void
  onSave: () => void
  onShare: () => void
  onUnfollow: () => void
  playing: boolean
  previewing: boolean
  streamConditions: AccessConditions | null
  downloadConditions: AccessConditions | null
  released: string
  repostCount: number
  saveCount: number
  tags: string
  trackId: number
  trackTitle: string
  userId: number
  ddexApp?: string | null
  overrideArtwork?: string
}

export const ServerGiantTrackTile = ({
  aiAttributionUserId,
  badge,
  coSign,
  credits,
  description,
  duration,
  fieldVisibility,
  following,
  genre,
  isOwner,
  isStreamGated,
  isRemix,
  isScheduledRelease,
  isUnlisted,
  loading,
  mood,
  onClickFavorites,
  onClickReposts,
  onFollow,
  onUnfollow,
  released,
  repostCount,
  saveCount,
  streamConditions,
  trackId,
  trackTitle,
  userId,
  overrideArtwork
}: ServerGiantTrackTileProps) => {
  const track = useSelector(
    (state: CommonState) => state.tracks.entries[trackId],
    shallowEqual
  )

  const renderCardTitle = (className: string) => {
    return (
      <CardTitle
        className={className}
        isUnlisted={isUnlisted}
        isScheduledRelease={isScheduledRelease}
        isRemix={isRemix}
        isStreamGated={isStreamGated}
        // isPodcast={genre === Genre.PODCASTS}
        isPodcast={genre === 'Podcasts'}
        streamConditions={streamConditions}
      />
    )
  }

  const renderMood = () => {
    const shouldShow = !isUnlisted || fieldVisibility.mood
    return (
      shouldShow &&
      mood && (
        <InfoLabel
          className={styles.infoLabelPlacement}
          labelName='mood'
          labelValue={mood in moodMap ? moodMap[mood] : mood}
        />
      )
    )
  }

  const renderGenre = () => {
    const shouldShow = !isUnlisted || fieldVisibility.genre

    return (
      shouldShow && (
        <InfoLabel
          className={styles.infoLabelPlacement}
          labelName='genre'
          labelValue={genre}
        />
      )
    )
  }

  const renderReleased = () => {
    return (
      !isUnlisted &&
      released && (
        <InfoLabel
          className={styles.infoLabelPlacement}
          labelName='released'
          labelValue={formatDate(released)}
        />
      )
    )
  }

  const renderStatsRow = () => {
    return (
      <RepostFavoritesStats
        isUnlisted={isUnlisted}
        repostCount={repostCount}
        saveCount={saveCount}
        onClickReposts={onClickReposts}
        onClickFavorites={onClickFavorites}
      />
    )
  }

  const renderScheduledReleaseRow = () => {
    return (
      <ScheduledReleaseGiantLabel released={released} isUnlisted={isUnlisted} />
    )
  }

  const isLoading = loading

  const overflowMenuExtraItems = []
  if (!isOwner) {
    overflowMenuExtraItems.push({
      text: following ? 'Unfollow Artist' : 'Follow Artist',
      onClick: () =>
        setTimeout(() => (following ? onUnfollow() : onFollow()), 0)
    })
  }

  const fadeIn = {
    [styles.show]: !isLoading,
    [styles.hide]: isLoading
  }

  return (
    <Tile className={styles.giantTrackTile} size='large' elevation='mid'>
      <div className={styles.topSection}>
        <ServerGiantArtwork
          overrideArtwork={overrideArtwork}
          coSign={coSign}
          // @ts-ignore
          cid={track?.cover_art_sizes ?? null}
        />
        <div className={styles.infoSection}>
          <div className={styles.infoSectionHeader}>
            {renderCardTitle(cn(fadeIn))}
            <div className={styles.title}>
              <Text variant='heading' size='xl' className={cn(fadeIn)}>
                {trackTitle}
              </Text>
              {isLoading && <Skeleton className={styles.skeleton} />}
            </div>
            <Flex>
              <Text
                variant='title'
                strength='weak'
                tag='h2'
                className={cn(fadeIn)}
              >
                <Text color='subdued'>By </Text>
                <ServerUserLink userId={userId} popover />
              </Text>
              {isLoading && (
                <Skeleton className={styles.skeleton} width='60%' />
              )}
            </Flex>
          </div>

          <div className={cn(styles.statsSection, fadeIn)}>
            {renderStatsRow()}
            {renderScheduledReleaseRow()}
          </div>
        </div>
        <div className={styles.badges}>
          {aiAttributionUserId ? (
            <Badge
              icon={<IconRobot />}
              className={styles.badgeAi}
              textLabel={messages.generatedWithAi}
            />
          ) : null}
          {badge ? (
            <Badge className={styles.badgePlacement} textLabel={badge} />
          ) : null}
        </div>
      </div>

      <div className={cn(styles.bottomSection, fadeIn)}>
        <div className={styles.infoLabelsSection}>
          <InfoLabel
            className={styles.infoLabelPlacement}
            labelName='duration'
            labelValue={`${formatSeconds(duration)}`}
          />
          {renderReleased()}
          {renderGenre()}
          {renderMood()}
          {credits ? (
            <InfoLabel
              className={styles.infoLabelPlacement}
              labelName='credit'
              labelValue={credits}
            />
          ) : null}
        </div>
        {description ? (
          <ServerUserGeneratedText
            tag='h3'
            size='s'
            className={styles.description}
          >
            {description}
          </ServerUserGeneratedText>
        ) : null}
      </div>
    </Tile>
  )
}
