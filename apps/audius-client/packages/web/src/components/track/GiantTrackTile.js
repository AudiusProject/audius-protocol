import { PureComponent } from 'react'

import {
  squashNewLines,
  getCanonicalName,
  formatDate,
  formatSeconds,
  Genre,
  FeatureFlags,
  isAudiusUrl,
  getPathFromAudiusUrl
} from '@audius/common'
import {
  Button,
  ButtonType,
  IconShare,
  IconRocket,
  IconRepost,
  IconHeart,
  IconKebabHorizontal
} from '@audius/stems'
import cn from 'classnames'
import Linkify from 'linkify-react'
import PropTypes from 'prop-types'

import { ReactComponent as IconRobot } from 'assets/img/robot.svg'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import DownloadButtons from 'components/download-buttons/DownloadButtons'
import { EntityActionButton } from 'components/entity-page/EntityActionButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Menu from 'components/menu/Menu'
import RepostFavoritesStats from 'components/repost-favorites-stats/RepostFavoritesStats'
import { SearchTag } from 'components/search/SearchTag'
import Skeleton from 'components/skeleton/Skeleton'
import { Tile } from 'components/tile'
import Toast from 'components/toast/Toast'
import Tooltip from 'components/tooltip/Tooltip'
import UserBadges from 'components/user-badges/UserBadges'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { moodMap } from 'utils/Moods'

import { DogEarType } from '../dog-ear/DogEar'

import { AiTrackSection } from './AiTrackSection'
import Badge from './Badge'
import { CardTitle } from './CardTitle'
import GiantArtwork from './GiantArtwork'
import styles from './GiantTrackTile.module.css'
import { GiantTrackTileProgressInfo } from './GiantTrackTileProgressInfo'
import InfoLabel from './InfoLabel'
import { PlayPauseButton } from './PlayPauseButton'
import { PremiumTrackSection } from './PremiumTrackSection'

const BUTTON_COLLAPSE_WIDTHS = {
  first: 1095,
  second: 1190,
  third: 1286
}

// Toast timeouts in ms
const REPOST_TIMEOUT = 1000
const SAVED_TIMEOUT = 1000

const messages = {
  makePublic: 'MAKE PUBLIC',
  isPublishing: 'PUBLISHING',
  repostButtonText: 'repost',
  repostedButtonText: 'reposted',
  unplayed: 'Unplayed',
  timeLeft: 'left',
  played: 'Played',
  generatedWithAi: 'Generated With AI',
  actionGroupLabel: 'collection actions'
}

class GiantTrackTile extends PureComponent {
  state = {
    artworkLoading: true
  }

  renderCardTitle(className) {
    const { isUnlisted, isRemix, genre, isPremium, premiumConditions } =
      this.props
    return (
      <CardTitle
        className={className}
        isUnlisted={isUnlisted}
        isRemix={isRemix}
        isPremium={isPremium}
        isPodcast={genre === Genre.PODCASTS}
        premiumConditions={premiumConditions}
      />
    )
  }

  renderShareButton() {
    const { isUnlisted, isPublishing, fieldVisibility, onShare } = this.props
    const shouldShow = (!isUnlisted && !isPublishing) || fieldVisibility.share
    return (
      shouldShow && (
        <EntityActionButton
          type={ButtonType.COMMON}
          text='share'
          leftIcon={<IconShare />}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
          onClick={onShare}
        />
      )
    )
  }

  renderMakePublicButton() {
    const { isUnlisted, isPublishing, makePublic, trackId, isOwner } =
      this.props
    return (
      (isUnlisted || isPublishing) &&
      isOwner && (
        <EntityActionButton
          type={isPublishing ? ButtonType.DISABLED : ButtonType.COMMON}
          text={isPublishing ? messages.isPublishing : messages.makePublic}
          leftIcon={
            isPublishing ? (
              <LoadingSpinner className={styles.spinner} />
            ) : (
              <IconRocket />
            )
          }
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
          onClick={isPublishing ? undefined : () => makePublic(trackId)}
        />
      )
    )
  }

  renderRepostButton() {
    const {
      isUnlisted,
      isPublishing,
      isReposted,
      isOwner,
      repostCount,
      onRepost
    } = this.props
    return (
      !isUnlisted &&
      !isPublishing &&
      !isOwner && (
        <Toast
          placement='bottom'
          text={'Reposted!'}
          disabled={isReposted}
          delay={REPOST_TIMEOUT}
          fillParent={false}
        >
          <Tooltip
            disabled={isOwner || repostCount === 0}
            text={isReposted ? 'Unrepost' : 'Repost'}
          >
            <div>
              <EntityActionButton
                name='repost'
                type={
                  isOwner
                    ? ButtonType.DISABLED
                    : isReposted
                    ? ButtonType.SECONDARY
                    : ButtonType.COMMON
                }
                widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
                text={
                  isReposted
                    ? messages.repostedButtonText
                    : messages.repostButtonText
                }
                leftIcon={<IconRepost />}
                onClick={isOwner ? () => {} : onRepost}
              />
            </div>
          </Tooltip>
        </Toast>
      )
    )
  }

  renderFavoriteButton() {
    const { isUnlisted, isSaved, isOwner, onSave, saveCount } = this.props
    return (
      !isUnlisted &&
      !isOwner && (
        <Toast
          placement='bottom'
          text={'Favorited!'}
          disabled={isSaved}
          delay={SAVED_TIMEOUT}
          fillParent={false}
        >
          <Tooltip
            disabled={isOwner || saveCount === 0}
            text={isSaved ? 'Unfavorite' : 'Favorite'}
          >
            <div>
              <EntityActionButton
                name='favorite'
                type={
                  isOwner
                    ? ButtonType.DISABLED
                    : isSaved
                    ? ButtonType.SECONDARY
                    : ButtonType.COMMON
                }
                text={isSaved ? 'FAVORITED' : 'FAVORITE'}
                widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
                leftIcon={<IconHeart />}
                onClick={isOwner ? undefined : onSave}
              />
            </div>
          </Tooltip>
        </Toast>
      )
    )
  }

  renderMood() {
    const { mood, isUnlisted, fieldVisibility } = this.props
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

  renderGenre() {
    const { isUnlisted, fieldVisibility, genre } = this.props
    const shouldShow = !isUnlisted || fieldVisibility.genre

    return (
      shouldShow && (
        <InfoLabel
          className={styles.infoLabelPlacement}
          labelName='genre'
          labelValue={getCanonicalName(genre)}
        />
      )
    )
  }

  renderListenCount() {
    const { listenCount, isUnlisted, fieldVisibility } = this.props
    const shouldShow = !isUnlisted || fieldVisibility.play_count
    return (
      shouldShow && (
        <div className={styles.listens}>
          {listenCount === 0 ? (
            <span className={styles.firstListen}>
              Be the first to listen to this track!
            </span>
          ) : (
            <>
              <span className={styles.numberOfListens}>
                {listenCount.toLocaleString()}
              </span>
              <span className={styles.listenText}>
                {listenCount === 1 ? 'Play' : 'Plays'}
              </span>
            </>
          )}
        </div>
      )
    )
  }

  renderTags() {
    const { isUnlisted, fieldVisibility, tags } = this.props
    const shouldShow = !isUnlisted || fieldVisibility.tags
    return (
      shouldShow &&
      tags && (
        <div className={styles.tagSection}>
          {tags
            .split(',')
            .filter((t) => t)
            .map((tag) => (
              <SearchTag
                className={styles.tagFormatting}
                tag={tag}
                key={tag}
                source='track page'
              />
            ))}
        </div>
      )
    )
  }

  renderReleased() {
    const { isUnlisted, released } = this.props
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

  renderStatsRow() {
    const {
      isUnlisted,
      genre,
      repostCount,
      saveCount,
      onClickReposts,
      onClickFavorites
    } = this.props
    const isLongFormContent =
      genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS
    const isNewPodcastControlsEnabled = getFeatureEnabled(
      FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
      FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
    )

    return (
      <>
        <RepostFavoritesStats
          isUnlisted={isUnlisted}
          repostCount={repostCount}
          saveCount={saveCount}
          onClickReposts={onClickReposts}
          onClickFavorites={onClickFavorites}
        />
        {isLongFormContent && isNewPodcastControlsEnabled
          ? this.renderListenCount()
          : null}
      </>
    )
  }

  onArtworkLoad = () => {
    this.setState({ artworkLoading: false })
  }

  renderDownloadButtons = () => {
    return (
      <DownloadButtons
        className={styles.downloadButtonsContainer}
        trackId={this.props.trackId}
        isOwner={this.props.isOwner}
        following={this.props.following}
        doesUserHaveAccess={this.props.doesUserHaveAccess}
        onDownload={this.props.onDownload}
      />
    )
  }

  render() {
    const {
      playing,
      trackId,
      trackTitle,
      coverArtSizes,
      artistName,
      artistHandle,
      description,
      duration,
      genre,
      credits,
      isOwner,
      isSaved,
      badge,
      onClickArtistName,
      onPlay,
      following,
      onFollow,
      onUnfollow,
      isArtistPick,
      isUnlisted,
      isPremium,
      aiAttributionUserId,
      premiumConditions,
      doesUserHaveAccess,
      onExternalLinkClick,
      onInternalLinkClick,
      coSign,
      loading,
      userId
    } = this.props
    const { artworkLoading } = this.state
    const isLongFormContent =
      genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS
    const isNewPodcastControlsEnabled = getFeatureEnabled(
      FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
      FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
    )

    const isLoading = loading || artworkLoading
    const showPremiumDogEar =
      !isLoading && premiumConditions && (isOwner || !doesUserHaveAccess)
    const dogEarType = showPremiumDogEar
      ? isOwner
        ? premiumConditions.nft_collection
          ? DogEarType.COLLECTIBLE_GATED
          : DogEarType.SPECIAL_ACCESS
        : DogEarType.LOCKED
      : isUnlisted
      ? DogEarType.HIDDEN
      : null

    const overflowMenuExtraItems = []
    if (!isOwner) {
      overflowMenuExtraItems.push({
        text: following ? 'Unfollow Artist' : 'Follow Artist',
        onClick: () =>
          setTimeout(() => (following ? onUnfollow() : onFollow()), 0)
      })
    }

    const overflowMenu = {
      menu: {
        type: 'track',
        trackId,
        trackTitle,
        genre,
        handle: artistHandle,
        isFavorited: isSaved,
        mount: 'page',
        isOwner,
        includeFavorite: false,
        includeTrackPage: false,
        isArtistPick,
        includeEmbed: !(isUnlisted || isPremium),
        includeArtistPick: !isUnlisted,
        includeAddToPlaylist: !(isUnlisted || isPremium),
        extraMenuItems: overflowMenuExtraItems
      }
    }

    const fadeIn = {
      [styles.show]: !isLoading,
      [styles.hide]: isLoading
    }

    return (
      <Tile
        className={styles.giantTrackTile}
        dogEar={dogEarType}
        size='large'
        elevation='mid'
      >
        <div className={styles.topSection}>
          <GiantArtwork
            trackId={trackId}
            coverArtSizes={coverArtSizes}
            coSign={coSign}
            callback={this.onArtworkLoad}
          />
          <div className={styles.infoSection}>
            <div className={styles.infoSectionHeader}>
              {this.renderCardTitle(fadeIn)}
              <div className={styles.title}>
                <h1 className={cn(fadeIn)}>{trackTitle}</h1>
                {isLoading && <Skeleton className={styles.skeleton} />}
              </div>
              <div className={styles.artistWrapper}>
                <div className={cn(fadeIn)}>
                  <span>By</span>
                  <ArtistPopover handle={artistHandle}>
                    <h2 className={styles.artist} onClick={onClickArtistName}>
                      {artistName}
                      <UserBadges
                        className={styles.verified}
                        badgeSize={18}
                        userId={userId}
                      />
                    </h2>
                  </ArtistPopover>
                </div>
                {isLoading && (
                  <Skeleton className={styles.skeleton} width='60%' />
                )}
              </div>
            </div>

            <div className={cn(styles.playSection, fadeIn)}>
              <PlayPauseButton
                doesUserHaveAccess={doesUserHaveAccess}
                playing={playing}
                onPlay={onPlay}
                trackId={trackId}
              />
              {isLongFormContent && isNewPodcastControlsEnabled ? (
                <GiantTrackTileProgressInfo
                  duration={duration}
                  trackId={trackId}
                />
              ) : (
                this.renderListenCount()
              )}
            </div>

            <div className={cn(styles.statsSection, fadeIn)}>
              {this.renderStatsRow()}
            </div>

            <div
              className={cn(styles.actionButtons, fadeIn)}
              role='group'
              aria-label={messages.actionGroupLabel}
            >
              {this.renderShareButton()}
              {this.renderMakePublicButton()}
              {doesUserHaveAccess && this.renderRepostButton()}
              {doesUserHaveAccess && this.renderFavoriteButton()}
              <span>
                <Menu {...overflowMenu}>
                  {(ref, triggerPopup) => (
                    <div className={cn(styles.menuKebabContainer)} ref={ref}>
                      <Button
                        className={cn(
                          styles.buttonFormatting,
                          styles.moreButton
                        )}
                        leftIcon={<IconKebabHorizontal />}
                        onClick={triggerPopup}
                        text={null}
                        textClassName={styles.buttonTextFormatting}
                        type={ButtonType.COMMON}
                      />
                    </div>
                  )}
                </Menu>
              </span>
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

        {isPremium ? (
          <PremiumTrackSection
            isLoading={isLoading}
            trackId={trackId}
            premiumConditions={premiumConditions}
            doesUserHaveAccess={doesUserHaveAccess}
            isOwner={isOwner}
          />
        ) : null}

        {aiAttributionUserId ? (
          <AiTrackSection attributedUserId={aiAttributionUserId} />
        ) : null}

        <div className={cn(styles.bottomSection, fadeIn)}>
          <div className={styles.infoLabelsSection}>
            <InfoLabel
              className={styles.infoLabelPlacement}
              labelName='duration'
              labelValue={`${formatSeconds(duration)}`}
            />
            {this.renderReleased()}
            {this.renderGenre()}
            {this.renderMood()}
            {credits ? (
              <InfoLabel
                className={styles.infoLabelPlacement}
                labelName='credit'
                labelValue={credits}
              />
            ) : null}
          </div>
          {description ? (
            <Linkify
              options={{
                attributes: {
                  onClick: (event) => {
                    const url = event.currentTarget.href

                    if (isAudiusUrl(url)) {
                      const path = getPathFromAudiusUrl(url)
                      event.nativeEvent.preventDefault()
                      onInternalLinkClick(path ?? '/')
                    } else {
                      onExternalLinkClick(event)
                    }
                  }
                },
                target: (href, type, tokens) => {
                  return isAudiusUrl(href) ? '' : '_blank'
                }
              }}
            >
              <h3 className={styles.description}>
                {squashNewLines(description)}
              </h3>
            </Linkify>
          ) : null}
          {this.renderTags()}
          {this.renderDownloadButtons()}
        </div>
      </Tile>
    )
  }
}

GiantTrackTile.propTypes = {
  currentUserId: PropTypes.number,
  userId: PropTypes.number,
  loading: PropTypes.bool,
  playing: PropTypes.bool,
  active: PropTypes.bool,
  trackTitle: PropTypes.string,
  trackId: PropTypes.number,
  artistName: PropTypes.string,
  artistHandle: PropTypes.string,
  coverArtSizes: PropTypes.object,
  tags: PropTypes.string,
  description: PropTypes.string,
  listenCount: PropTypes.number,
  duration: PropTypes.number,
  released: PropTypes.string,
  credits: PropTypes.string,
  genre: PropTypes.string,
  mood: PropTypes.string,
  repostCount: PropTypes.number,
  saveCount: PropTypes.number,
  isOwner: PropTypes.bool,
  isReposted: PropTypes.bool,
  isSaved: PropTypes.bool,
  isDownloadable: PropTypes.bool,
  badge: PropTypes.string,
  isUnlisted: PropTypes.bool,
  isPremium: PropTypes.bool,
  premiumConditions: PropTypes.object,
  doesUserHaveAccess: PropTypes.bool,
  isRemix: PropTypes.bool,
  isPublishing: PropTypes.bool,
  fieldVisibility: PropTypes.object,
  coSign: PropTypes.object,
  // Actions
  onClickArtistName: PropTypes.func,
  onPlay: PropTypes.func,
  onShare: PropTypes.func,
  onRepost: PropTypes.func,
  onSave: PropTypes.func,
  following: PropTypes.bool,
  onFollow: PropTypes.func,
  onUnfollow: PropTypes.func,
  onDownload: PropTypes.func
}

GiantTrackTile.defaultProps = {
  loading: false,
  playing: false,
  active: true,
  tags: '',
  description: '',
  listenCount: 0,
  duration: 0,
  released: '',
  credits: '',
  genre: '',
  mood: '',
  repostCount: 0,
  saveCount: 0,
  isOwner: true,
  isReposted: false,
  isSaved: false,
  badge: '',
  // Actions
  onClickArtistName: () => {},
  onPlay: () => {},
  onShare: () => {},
  onRepost: () => {},
  onSave: () => {},
  onFollow: () => {},
  onDownload: () => {}
}

export default GiantTrackTile
