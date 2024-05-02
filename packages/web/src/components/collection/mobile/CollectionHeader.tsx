import { memo, useCallback } from 'react'

import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import { imageBlank } from '@audius/common/assets'
import { useGatedContentAccess } from '@audius/common/hooks'
import { Variant, SquareSizes, ID, ModalSource } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  OverflowAction,
  PurchaseableContentType,
  useEditPlaylistModal
} from '@audius/common/store'
import { Box, Button, Flex, IconPause, IconPlay, Text } from '@audius/harmony'
import cn from 'classnames'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { UserLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { StaticImage } from 'components/static-image/StaticImage'
import { GatedContentSection } from 'components/track/GatedContentSection'
import { UserGeneratedText } from 'components/user-generated-text'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useFlag } from 'hooks/useRemoteConfig'
import ActionButtonRow from 'pages/track-page/components/mobile/ActionButtonRow'
import { useSsrContext } from 'ssr/SsrContext'
import { isShareToastDisabled } from 'utils/clipboardUtil'
import { isDarkMode } from 'utils/theme/theme'

import { AlbumDetailsText } from '../components/AlbumDetailsText'
import { RepostsFavoritesStats } from '../components/RepostsFavoritesStats'
import { CollectionHeaderProps } from '../types'

import styles from './CollectionHeader.module.css'

const messages = {
  hiddenPlaylist: 'Hidden Playlist',
  publishing: 'Publishing...',
  play: 'PLAY',
  pause: 'PAUSE',
  preview: 'PREVIEW',
  coverArtAltText: 'Collection Cover Art'
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
  isStreamGated,
  streamConditions,
  access,
  duration,
  isPublished = false,
  isPublishing = false,
  isAlbum = false,
  loading = false,
  playing = false,
  previewing = false,
  saves = 0,
  reposts,
  onPlay = () => {},
  onPreview = () => {},
  onShare,
  onSave,
  onRepost,
  onClickFavorites = () => {},
  onClickReposts = () => {},
  onClickMobileOverflow,
  variant,
  gradient,
  imageOverride,
  icon: Icon
}: MobileCollectionHeaderProps) => {
  const { isSsrEnabled } = useSsrContext()
  const { isEnabled: isEditAlbumsEnabled } = useFlag(FeatureFlags.EDIT_ALBUMS)
  const { isEnabled: isPremiumAlbumsEnabled } = useFlag(
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )

  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: collection } = useGetPlaylistById(
    {
      playlistId: typeof collectionId === 'number' ? collectionId : null,
      currentUserId
    },
    { disabled: typeof collectionId !== 'number' }
  )
  const { hasStreamAccess } = useGatedContentAccess(collection)
  const isPremium = collection?.is_stream_gated

  // If user doesn't have access, show preview only. If user has access, show play only.
  // If user is owner, show both.
  const shouldShowPlay = isPlayable && hasStreamAccess
  const shouldShowPreview = isOwner
    ? isPlayable && isPremium
    : isPremium && !hasStreamAccess

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
        {shouldShowPlay ? (
          <Button
            variant='primary'
            iconLeft={playing && !previewing ? IconPause : IconPlay}
            onClick={onPlay}
            fullWidth
          >
            {playing && !previewing ? messages.pause : messages.play}
          </Button>
        ) : null}
        {shouldShowPreview ? (
          <Button
            variant='secondary'
            iconLeft={playing && previewing ? IconPause : IconPlay}
            onClick={onPreview}
            fullWidth
          >
            {playing && previewing ? messages.pause : messages.preview}
          </Button>
        ) : null}
        {isPremiumAlbumsEnabled &&
        isAlbum &&
        streamConditions &&
        collectionId ? (
          <Box mb='xl' w='100%'>
            <GatedContentSection
              isLoading={isLoading}
              contentId={collectionId}
              contentType={PurchaseableContentType.ALBUM}
              streamConditions={streamConditions}
              hasStreamAccess={!!access?.stream}
              isOwner={isOwner}
              wrapperClassName={styles.gatedContentSectionWrapper}
              className={styles.gatedContentSection}
              buttonClassName={styles.gatedContentSectionButton}
              ownerId={userId}
              source={ModalSource.CollectionDetails}
            />
          </Box>
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
          <RepostsFavoritesStats
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
