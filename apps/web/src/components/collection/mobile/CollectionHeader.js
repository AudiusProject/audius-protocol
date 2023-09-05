import { memo, useCallback } from 'react'

import {
  Name,
  Variant,
  SquareSizes,
  formatCount,
  squashNewLines,
  formatSecondsAsText,
  formatDate,
  OverflowAction
} from '@audius/common'
import { Button, ButtonType, IconPause, IconPlay } from '@audius/stems'
import cn from 'classnames'
import Linkify from 'linkifyjs/react'
import PropTypes from 'prop-types'

import { make, useRecord } from 'common/store/analytics/actions'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import Skeleton from 'components/skeleton/Skeleton'
import UserBadges from 'components/user-badges/UserBadges'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import ActionButtonRow from 'pages/track-page/components/mobile/ActionButtonRow'
import StatsButtonRow from 'pages/track-page/components/mobile/StatsButtonRow'
import { isShareToastDisabled } from 'utils/clipboardUtil'
import { isDarkMode } from 'utils/theme/theme'

import styles from './CollectionHeader.module.css'

const messages = {
  privatePlaylist: 'Private Playlist',
  publishing: 'Publishing...',
  play: 'PLAY',
  pause: 'PAUSE'
}

const Loading = (props) => {
  const style = {
    [styles.loadingArtwork]: props.variant === 'artwork',
    [styles.loadingTitle]: props.variant === 'title',
    [styles.loadingName]: props.variant === 'name',
    [styles.loadingInfoSection]: props.variant === 'infoSection',
    [styles.loadingDescription]: props.variant === 'description'
  }
  return (
    <Skeleton
      title={false}
      paragraph={{ rows: 1 }}
      active
      className={cn(styles.loadingSkeleton, style)}
    />
  )
}

const PlayButton = (props) => {
  return props.playing ? (
    <Button
      className={cn(styles.playAllButton, styles.buttonFormatting)}
      textClassName={styles.playAllButtonText}
      type={ButtonType.PRIMARY_ALT}
      text={messages.pause}
      leftIcon={<IconPause />}
      onClick={props.onPlay}
    />
  ) : (
    <Button
      className={cn(styles.playAllButton, styles.buttonFormatting)}
      textClassName={styles.playAllButtonText}
      type={ButtonType.PRIMARY_ALT}
      text={messages.play}
      leftIcon={<IconPlay />}
      onClick={props.onPlay}
    />
  )
}

const CollectionHeader = ({
  type,
  collectionId,
  userId,
  title,
  coverArtSizes,
  artistName,
  description,
  isOwner,
  isReposted,
  isSaved,
  modified,
  numTracks,
  duration,
  isPublished,
  isPublishing,
  isAlbum,
  loading,
  playing,
  saves,
  repostCount,
  onClickArtistName,
  onPlay,
  onShare,
  onSave,
  onRepost,
  onClickFavorites,
  onClickReposts,
  onClickMobileOverflow,
  variant,
  gradient,
  imageOverride,
  icon: Icon
}) => {
  const onSaveCollection = () => {
    if (!isOwner) onSave()
  }

  const onClickOverflow = () => {
    const overflowActions = [
      isOwner || !isPublished
        ? null
        : isReposted
        ? OverflowAction.UNREPOST
        : OverflowAction.REPOST,
      isOwner || !isPublished
        ? null
        : isSaved
        ? OverflowAction.UNFAVORITE
        : OverflowAction.FAVORITE,
      !isAlbum && isOwner ? OverflowAction.EDIT_PLAYLIST : null,
      isOwner && !isAlbum && !isPublished
        ? OverflowAction.PUBLISH_PLAYLIST
        : null,
      isOwner && !isAlbum ? OverflowAction.DELETE_PLAYLIST : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean)

    onClickMobileOverflow(collectionId, overflowActions)
  }

  const image = useCollectionCoverArt(
    collectionId,
    coverArtSizes,
    SquareSizes.SIZE_1000_BY_1000
  )

  const record = useRecord()
  const onDescriptionExternalLink = useCallback(
    (event) => {
      record(
        make(Name.LINK_CLICKING, {
          url: event.target.href,
          source: 'collection page'
        })
      )
    },
    [record]
  )

  const collectionLabels = [
    {
      label: 'Tracks',
      value: formatCount(numTracks)
    },
    duration && {
      label: 'Duration',
      value: formatSecondsAsText(duration)
    },
    {
      label: 'Modified',
      value: formatDate(modified),
      isHidden: variant === Variant.SMART
    }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  const renderCollectionLabels = () => {
    return collectionLabels.map((infoFact) => {
      return (
        <div key={infoFact.label} className={styles.infoFact}>
          <h2 className={styles.infoLabel}>{infoFact.label}</h2>
          <h2 className={styles.infoValue}>{infoFact.value}</h2>
        </div>
      )
    })
  }

  return (
    <div className={styles.collectionHeader}>
      <div className={styles.typeLabel}>
        {type === 'playlist' && !isPublished
          ? isPublishing
            ? messages.publishing
            : messages.privatePlaylist
          : type}
      </div>
      {loading ? (
        <>
          <div className={styles.coverArt}>
            <Loading variant='artwork' />
          </div>
          <div className={styles.title}>
            <Loading variant='title' />
          </div>
          <div className={styles.artist} onClick={onClickArtistName}>
            <Loading variant='name' />
          </div>

          <div className={styles.loadingInfoSection}>
            <Loading variant='infoSection' />
          </div>
          <div className={styles.loadingDescription}>
            <Loading variant='description' />
          </div>
        </>
      ) : (
        <>
          <DynamicImage
            wrapperClassName={styles.coverArt}
            image={gradient || imageOverride || image}
          >
            {Icon && (
              <Icon
                className={styles.imageIcon}
                style={{ background: gradient }}
              />
            )}
          </DynamicImage>
          <h1 className={styles.title}>{title}</h1>
          {artistName && (
            <div className={styles.artist} onClick={onClickArtistName}>
              <h2>{artistName}</h2>
              <UserBadges
                userId={userId}
                badgeSize={16}
                className={styles.verified}
              />
            </div>
          )}
          <div className={styles.buttonSection}>
            <PlayButton playing={playing} onPlay={onPlay} />
            <ActionButtonRow
              isOwner={isOwner}
              isSaved={isSaved}
              onFavorite={onSaveCollection}
              onShare={onShare}
              shareToastDisabled={isShareToastDisabled}
              isReposted={isReposted}
              isPublished={isPublished}
              isPublishing={isPublishing}
              onRepost={onRepost}
              onClickOverflow={onClickOverflow}
              showFavorite={!!onSave}
              showRepost={variant !== Variant.SMART}
              showShare={
                variant !== Variant.SMART || type === 'Audio NFT Playlist'
              }
              showOverflow={variant !== Variant.SMART}
              darkMode={isDarkMode()}
            />
          </div>
          {isPublished && variant !== Variant.SMART && (
            <StatsButtonRow
              showListenCount={false}
              showFavoriteCount
              showRepostCount
              favoriteCount={saves}
              repostCount={repostCount}
              onClickFavorites={onClickFavorites}
              onClickReposts={onClickReposts}
            />
          )}
          <div
            className={cn(styles.infoSection, {
              [styles.noStats]: !isPublished || variant === Variant.SMART
            })}
          >
            {renderCollectionLabels()}
          </div>
          {description ? (
            <Linkify
              options={{ attributes: { onClick: onDescriptionExternalLink } }}
            >
              <div className={styles.description}>
                {squashNewLines(description)}
              </div>
            </Linkify>
          ) : null}
        </>
      )}
    </div>
  )
}

CollectionHeader.propTypes = {
  collectionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  userId: PropTypes.number,
  loading: PropTypes.bool,
  tracksLoading: PropTypes.bool,
  playing: PropTypes.bool,
  active: PropTypes.bool,
  type: PropTypes.oneOf(['playlist', 'album']),
  title: PropTypes.string,
  artistName: PropTypes.string,
  artistHandle: PropTypes.string,
  coverArtSizes: PropTypes.object,
  description: PropTypes.string,

  isOwner: PropTypes.bool,
  isAlbum: PropTypes.bool,
  isReposted: PropTypes.bool,
  hasTracks: PropTypes.bool,
  isPublished: PropTypes.bool,
  isPublishing: PropTypes.bool,
  isSaved: PropTypes.bool,
  saves: PropTypes.number,
  repostCount: PropTypes.number,

  // Actions
  onClickArtistName: PropTypes.func,
  onRepost: PropTypes.func,
  onPlay: PropTypes.func,
  onClickFavorites: PropTypes.func,
  onClickReposts: PropTypes.func,

  // Smart collection
  variant: PropTypes.any, // CollectionVariant
  gradient: PropTypes.string,
  icon: PropTypes.any
}

CollectionHeader.defaultProps = {
  loading: false,
  playing: false,
  active: true,
  type: 'playlist',
  description: '',

  isOwner: false,
  isAlbum: false,
  hasTracks: false,
  isPublished: false,
  isSaved: false,

  saves: 0,

  onPlay: () => {},
  onClickFavorites: () => {},
  onClickReposts: () => {}
}

export default memo(CollectionHeader)
