import { memo } from 'react'

import { imageBlank } from '@audius/common/assets'
import { Variant, SquareSizes } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { OverflowAction, cacheCollectionsSelectors } from '@audius/common/store'
import {
  formatCount,
  formatSecondsAsText,
  formatDate
} from '@audius/common/utils'
import { Button, IconPause, IconPlay } from '@audius/harmony'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { UserLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { StaticImage } from 'components/static-image/StaticImage'
import { UserGeneratedText } from 'components/user-generated-text'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useFlag } from 'hooks/useRemoteConfig'
import ActionButtonRow from 'pages/track-page/components/mobile/ActionButtonRow'
import StatsButtonRow from 'pages/track-page/components/mobile/StatsButtonRow'
import { useSsrContext } from 'ssr/SsrContext'
import { isShareToastDisabled } from 'utils/clipboardUtil'
import { isDarkMode } from 'utils/theme/theme'

import styles from './CollectionHeader.module.css'

const { getCollection } = cacheCollectionsSelectors

const messages = {
  hiddenPlaylist: 'Hidden Playlist',
  publishing: 'Publishing...',
  play: 'PLAY',
  pause: 'PAUSE',
  coverArtAltText: 'Collection Cover Art'
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
    <Button variant='primary' iconLeft={IconPause} onClick={props.onPlay}>
      {messages.pause}
    </Button>
  ) : (
    <Button variant='primary' iconLeft={IconPlay} onClick={props.onPlay}>
      {messages.play}
    </Button>
  )
}

const CollectionHeader = ({
  type,
  collectionId,
  userId,
  title,
  ddexApp,
  coverArtSizes,
  description,
  isOwner,
  isReposted,
  isSaved,
  modified,
  numTracks,
  isPlayable,
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
  const { isSsrEnabled } = useSsrContext()
  const { isEnabled: isEditAlbumsEnabled } = useFlag(FeatureFlags.EDIT_ALBUMS)
  const collection = useSelector((state) =>
    getCollection(state, { id: collectionId })
  )

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
      (!isAlbum || isEditAlbumsEnabled) && isOwner && !ddexApp
        ? isAlbum
          ? OverflowAction.EDIT_ALBUM
          : OverflowAction.EDIT_PLAYLIST
        : null,
      isOwner && (!isAlbum || isEditAlbumsEnabled) && !isPublished
        ? OverflowAction.PUBLISH_PLAYLIST
        : null,
      isOwner && (!isAlbum || isEditAlbumsEnabled) && !ddexApp
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

  const isLoading = !isSsrEnabled && loading
  const ImageElement = isSsrEnabled ? StaticImage : DynamicImage

  return (
    <div className={styles.collectionHeader}>
      <div className={styles.typeLabel}>
        {type === 'playlist' && !isPublished
          ? isPublishing
            ? messages.publishing
            : messages.hiddenPlaylist
          : type}
      </div>
      {isLoading ? (
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
          <ImageElement
            cid={collection?.cover_art_sizes}
            size={SquareSizes.SIZE_480_BY_480}
            fallbackImageUrl={imageBlank}
            alt={messages.coverArtAltText}
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
          </ImageElement>
          <h1 className={styles.title}>{title}</h1>
          <UserLink
            userId={userId}
            color='accent'
            size='l'
            textAs='h2'
            className={styles.artist}
          />
          <div className={styles.buttonSection}>
            {isPlayable ? (
              <PlayButton playing={playing} onPlay={onPlay} />
            ) : null}
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
  numTracks: PropTypes.number,
  isPlayable: PropTypes.bool,

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
