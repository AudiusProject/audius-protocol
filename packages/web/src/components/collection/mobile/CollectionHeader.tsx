import { MouseEventHandler, memo, useCallback } from 'react'

import { imageBlank } from '@audius/common/assets'
import { Variant, SquareSizes, Collection, ID } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  CommonState,
  OverflowAction,
  cacheCollectionsSelectors,
  useEditPlaylistModal
} from '@audius/common/store'
import {
  Button,
  ButtonProps,
  Flex,
  IconPause,
  IconPlay,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { UserLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { StaticImage } from 'components/static-image/StaticImage'
import { UserGeneratedText } from 'components/user-generated-text'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useFlag } from 'hooks/useRemoteConfig'
import ActionButtonRow from 'pages/track-page/components/mobile/ActionButtonRow'
import { useSsrContext } from 'ssr/SsrContext'
import { isShareToastDisabled } from 'utils/clipboardUtil'
import { isDarkMode } from 'utils/theme/theme'

import { AlbumDetailsText } from '../components/AlbumDetailsText'
import { RepostFavoritesStats } from '../components/RepostsFavoritesStats'
import { CollectionHeaderProps } from '../types'

import styles from './CollectionHeader.module.css'

const { getCollection } = cacheCollectionsSelectors

const messages = {
  hiddenPlaylist: 'Hidden Playlist',
  publishing: 'Publishing...',
  play: 'PLAY',
  pause: 'PAUSE',
  coverArtAltText: 'Collection Cover Art'
}

const PlayButton = ({
  playing,
  onPlay,
  ...rest
}: {
  playing: boolean
  onPlay: MouseEventHandler<HTMLButtonElement>
} & ButtonProps) => {
  return playing ? (
    <Button variant='primary' iconLeft={IconPause} onClick={onPlay} {...rest}>
      {messages.pause}
    </Button>
  ) : (
    <Button variant='primary' iconLeft={IconPlay} onClick={onPlay} {...rest}>
      {messages.play}
    </Button>
  )
}

type MobileCollectionHeaderProps = CollectionHeaderProps & {
  collectionId?: number
  ddexApp?: string | null
  isReposted?: boolean
  isSaved?: boolean
  isPublishing?: boolean
  onShare: () => void
  onSave?: () => void
  onRepost?: () => void
  onClickMobileOverflow?: (
    collectionId: ID,
    overflowActions: OverflowAction[]
  ) => void
}

const CollectionHeader = ({
  type,
  collectionId,
  userId,
  title,
  ddexApp,
  coverArtSizes,
  description = '',
  isOwner = false,
  isReposted = false,
  isSaved = false,
  releaseDate,
  lastModifiedDate,
  numTracks,
  isPlayable,
  duration,
  isPublished = false,
  isPublishing = false,
  isAlbum = false,
  loading = false,
  playing = false,
  saves = 0,
  reposts,
  onPlay = () => { },
  onShare,
  onSave,
  onRepost,
  onClickFavorites = () => { },
  onClickReposts = () => { },
  onClickMobileOverflow,
  variant,
  gradient,
  imageOverride,
  icon: Icon
}: MobileCollectionHeaderProps) => {
  const { isSsrEnabled } = useSsrContext()
  const { isEnabled: isEditAlbumsEnabled } = useFlag(FeatureFlags.EDIT_ALBUMS)
  const collection = useSelector((state: CommonState) =>
    getCollection(state, { id: collectionId })
  ) as Collection

  const onSaveCollection = () => {
    if (!isOwner) onSave?.()
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
      isOwner && (!isAlbum || isEditAlbumsEnabled) && !isPublished
        ? OverflowAction.PUBLISH_PLAYLIST
        : null,
      isOwner && (!isAlbum || isEditAlbumsEnabled) && !ddexApp
        ? isAlbum
          ? OverflowAction.DELETE_ALBUM
          : OverflowAction.DELETE_PLAYLIST
        : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

    onClickMobileOverflow?.(collectionId, overflowActions)
  }

  const image = useCollectionCoverArt(
    collectionId,
    coverArtSizes,
    SquareSizes.SIZE_1000_BY_1000
  )

  const { onOpen } = useEditPlaylistModal()
  const handleClickEdit = useCallback(() => {
    onOpen({ collectionId, initialFocusedField: 'name' })
  }, [onOpen, collectionId])

  const isLoading = isSsrEnabled && loading
  const ImageElement = isSsrEnabled ? StaticImage : DynamicImage

  if (isLoading) {
    return (
      <Flex alignItems='center' direction='column' gap='l' p='l'>
        <Skeleton
          className={cn(styles.coverArt)}
          css={{ borderRadius: '8px' }}
        />
        {/* title */}
        <Skeleton height='24px' width='224px' css={{ borderRadius: '4px' }} />
        {/* artist name */}
        <Skeleton height='24px' width='120px' css={{ borderRadius: '4px' }} />
        {/* play button */}
        <Skeleton height='48px' width='100%' css={{ borderRadius: '4px' }} />
        {/* social buttons */}
        <Skeleton height='24px' width='100%' css={{ borderRadius: '4px' }} />
        {/* description section */}
        <Skeleton height='120px' width='100%' css={{ borderRadius: '4px' }} />
      </Flex>
    )
  }

  return (
    <Flex direction='column'>
      <Flex direction='column' alignItems='center' p='l' gap='l'>
        <Text variant='label' css={{ letterSpacing: '2px' }} color='subdued'>
          {type === 'playlist' && !isPublished
            ? isPublishing
              ? messages.publishing
              : messages.hiddenPlaylist
            : type}
        </Text>
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
        <Flex gap='xs' direction='column' alignItems='center'>
          <Text variant='heading' size='s' tag='h1'>
            {title}
          </Text>
          {userId ? (
            <UserLink
              userId={userId}
              color='accent'
              size='l'
              textAs='h2'
              variant='visible'
            />
          ) : null}
        </Flex>
        {isPlayable ? (
          <PlayButton playing={playing} onPlay={onPlay} fullWidth />
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
          onClickEdit={handleClickEdit}
          showFavorite={!!onSave && !isOwner}
          showRepost={variant !== Variant.SMART && !isOwner}
          showShare={variant !== Variant.SMART || type === 'Audio NFT Playlist'}
          showOverflow={variant !== Variant.SMART}
          darkMode={isDarkMode()}
          showEdit={variant !== Variant.SMART && isOwner}
        />
      </Flex>
      <Flex
        direction='column'
        p='l'
        gap='l'
        backgroundColor='surface1'
        borderTop='strong'
        borderBottom='strong'
        justifyContent='flex-start'
      >
        {isPublished && variant !== Variant.SMART ? (
          <RepostFavoritesStats
            isUnlisted={false}
            repostCount={reposts}
            saveCount={saves}
            onClickReposts={onClickReposts}
            onClickFavorites={onClickFavorites}
          />
        ) : null}
        {description ? (
          <UserGeneratedText
            css={{ textAlign: 'left' }}
            linkSource='collection page'
          >
            {description}
          </UserGeneratedText>
        ) : null}
        <AlbumDetailsText
          duration={duration}
          lastModifiedDate={lastModifiedDate}
          numTracks={numTracks}
          releaseDate={releaseDate}
        />
      </Flex>
    </Flex>
  )
}

export default memo(CollectionHeader)
