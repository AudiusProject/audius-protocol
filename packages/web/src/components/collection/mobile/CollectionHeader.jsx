import { memo } from 'react'

import { Variant, SquareSizes } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { OverflowAction } from '@audius/common/store'
import {
  formatCount,
  formatSecondsAsText,
  formatDate
} from '@audius/common/utils'
import { IconPause, IconPlay } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { UserLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { UserGeneratedText } from 'components/user-generated-text'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useFlag } from 'hooks/useRemoteConfig'
import ActionButtonRow from 'pages/track-page/components/mobile/ActionButtonRow'
import StatsButtonRow from 'pages/track-page/components/mobile/StatsButtonRow'
import { isShareToastDisabled } from 'utils/clipboardUtil'
import { isDarkMode } from 'utils/theme/theme'

import styles from './CollectionHeader.module.css'

const messages = {
  hiddenPlaylist: 'Hidden Playlist',
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
  const { isEnabled: isEditAlbumsEnabled } = useFlag(FeatureFlags.EDIT_ALBUMS)

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
      (!isAlbum || isEditAlbumsEnabled) && isOwner
        ? isAlbum
          ? OverflowAction.EDIT_ALBUM
          : OverflowAction.EDIT_PLAYLIST
        : null,
      isOwner && (!isAlbum || isEditAlbumsEnabled) && !isPublished
        ? OverflowAction.PUBLISH_PLAYLIST
        : null,
      isOwner && (!isAlbum || isEditAlbumsEnabled)
        ? isAlbum
          ? OverflowAction.DELETE_ALBUM
          : OverflowAction.DELETE_PLAYLIST
        : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean)

    onClickMobileOverflow(collectionId, overflowActions)
  }

  const image = useCollectionCoverArt(
    collectionId,
    coverArtSizes,
    SquareSizes.SIZE_1000_BY_1000
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
            : messages.hiddenPlaylist
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
          <div className={styles.artist}>
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
                color='staticWhite'
                height='100%'
                width='100%'
                css={{
                  opacity: 0.3,
                  background: gradient,
                  mixBlendMode: 'overlay'
                }}
              />
            )}
          </DynamicImage>
          <h1 className={styles.title}>{title}</h1>
          <UserLink
            userId={userId}
            color='accent'
            size='l'
            textAs='h2'
            className={styles.artist}
          />
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
            <UserGeneratedText
              className={styles.description}
              linkSource='collection page'
            >
              {description}
            </UserGeneratedText>
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
