import { ChangeEvent, MouseEventHandler, useCallback, useState } from 'react'

import { useGetCurrentUserId } from '@audius/common/api'
import {
  AccessConditions,
  AccessPermissions,
  CoverArtSizes,
  ID,
  Variant,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  CollectionsPageType,
  PurchaseableContentType,
  useEditPlaylistModal
} from '@audius/common/store'
import { formatSecondsAsText, formatDate, Nullable } from '@audius/common/utils'
import {
  Text,
  IconVisibilityHidden,
  IconPencil,
  Flex,
  TextInput,
  TextInputSize,
  IconSearch,
  IconCart,
  useTheme,
  IconComponent,
  Box
} from '@audius/harmony'
import cn from 'classnames'

import { ClientOnly } from 'components/client-only/ClientOnly'
import { UserLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { GatedContentSection } from 'components/track/GatedContentSection'
import { UserGeneratedText } from 'components/user-generated-text'
import { useFlag } from 'hooks/useRemoteConfig'
import { useSsrContext } from 'ssr/SsrContext'

import { Artwork } from './Artwork'
import { CollectionActionButtons } from './CollectionActionButtons'
import styles from './CollectionHeader.module.css'
import { RepostFavoritesStats } from './RepostsFavoritesStats'

const messages = {
  filterPlaylist: 'Search in playlist...',
  filterAlbum: 'Search in album...',
  premiumLabel: 'premium',
  hiddenPlaylistLabel: 'hidden playlist',
  by: 'By '
}

type CollectionHeaderProps = {
  isStreamGated: Nullable<boolean>
  isPlayable: boolean
  isPublished: boolean
  tracksLoading: boolean
  loading: boolean
  playing: boolean
  isOwner: boolean
  isAlbum: boolean
  access: Nullable<AccessPermissions>
  collectionId: ID
  ownerId: Nullable<ID>
  type: CollectionsPageType | 'Playlist' | 'Audio NFT Playlist'
  title: string
  coverArtSizes: Nullable<CoverArtSizes>
  artistName: string
  description: string
  artistHandle: string
  releaseDate: string | number // either format should be utc time
  lastModifiedDate?: string | number // either format should be utc time
  numTracks: number
  duration: number
  variant: Nullable<Variant>
  gradient?: string
  icon: IconComponent
  imageOverride?: string
  userId: Nullable<ID>
  reposts: number
  saves: number
  streamConditions: Nullable<AccessConditions>
  onClickReposts?: () => void
  onClickFavorites?: () => void
  onPlay: MouseEventHandler<HTMLButtonElement>
  onFilterChange?: (e: ChangeEvent<HTMLInputElement>) => void
}

export const CollectionHeader = (props: CollectionHeaderProps) => {
  const {
    access,
    collectionId,
    ownerId,
    type,
    title,
    coverArtSizes,
    artistName,
    description,
    isOwner,
    releaseDate,
    lastModifiedDate,
    numTracks,
    isPlayable,
    duration,
    isPublished,
    tracksLoading,
    loading,
    playing,
    onPlay,
    variant,
    gradient,
    icon,
    imageOverride,
    userId,
    onFilterChange,
    reposts,
    saves,
    onClickReposts,
    onClickFavorites,
    isStreamGated,
    streamConditions
  } = props

  const { isEnabled: isPremiumAlbumsEnabled } = useFlag(
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )
  const { isSsrEnabled } = useSsrContext()
  const [artworkLoading, setIsArtworkLoading] = useState(true)
  const [filterText, setFilterText] = useState('')
  const { spacing } = useTheme()

  const { data: currentUserId } = useGetCurrentUserId({})

  const hasStreamAccess = access?.stream

  const handleFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newFilterText = e.target.value
      setFilterText(newFilterText)
      onFilterChange?.(e)
    },
    [onFilterChange]
  )

  const handleLoadArtwork = useCallback(() => {
    setIsArtworkLoading(false)
  }, [])

  const { onOpen } = useEditPlaylistModal()

  const handleClickEditTitle = useCallback(() => {
    onOpen({ collectionId, initialFocusedField: 'name' })
  }, [onOpen, collectionId])

  const renderStatsRow = (isLoading: boolean) => {
    if (isLoading) return null
    return (
      <RepostFavoritesStats
        isUnlisted={false}
        repostCount={reposts}
        saveCount={saves}
        onClickReposts={onClickReposts}
        onClickFavorites={onClickFavorites}
      />
    )
  }

  const isLoading = !isSsrEnabled && (loading || artworkLoading)

  const fadeIn = {
    [styles.show]: !isLoading,
    [styles.hide]: isLoading
  }

  const isPremium =
    isStreamGated && isContentUSDCPurchaseGated(streamConditions)

  const renderAlbumDetailsText = () => {
    const releaseAndUpdatedText = lastModifiedDate
      ? `Released ${formatDate(`${releaseDate}`)}, Updated ${formatDate(
        `${lastModifiedDate}`
      )}`
      : `Released ${formatDate(`${releaseDate}`)}`

    const trackCountText = `${numTracks} tracks`
    const durationText = duration ? `, ${formatSecondsAsText(duration)}` : ''
    return `${releaseAndUpdatedText} • ${trackCountText}${durationText}`
  }

  const topSection = (
    <Flex gap='xl' p='l' backgroundColor='white'>
      {coverArtSizes ? (
        <Artwork
          collectionId={collectionId}
          coverArtSizes={coverArtSizes}
          callback={handleLoadArtwork}
          gradient={gradient}
          icon={icon}
          imageOverride={imageOverride}
          isOwner={isOwner}
        />
      ) : null}
      <Flex direction='column' justifyContent='space-between'>
        <Flex direction='column' gap='xl'>
          <Flex className={cn(fadeIn)} gap='s' mt='s'>
            {!isPublished ? <IconVisibilityHidden /> : null}
            {isPremium ? <IconCart size='s' color='subdued' /> : null}
            <Text
              variant='label'
              color='subdued'
              css={{ letterSpacing: '2px' }}
            >
              {isPremium ? messages.premiumLabel : ''}
              {type === 'playlist' && !isPublished
                ? messages.hiddenPlaylistLabel
                : type}
            </Text>
          </Flex>
          <Flex direction='column' gap='s'>
            <Flex
              as={isOwner ? 'button' : 'span'}
              css={{ background: 0, border: 0, padding: 0, margin: 0 }}
              gap='s'
              alignItems='center'
              className={cn(styles.title, {
                [styles.editableTitle]: isOwner
              })}
              onClick={isOwner ? handleClickEditTitle : undefined}
            >
              <Text
                variant='heading'
                size='xl'
                className={cn(styles.titleHeader, fadeIn)}
              >
                {title}
              </Text>
              <ClientOnly>
                {isOwner ? (
                  <IconPencil className={styles.editIcon} color='subdued' />
                ) : null}
              </ClientOnly>
              {isLoading ? (
                <Skeleton css={{ position: 'absolute', top: 0 }} />
              ) : null}
            </Flex>
            {artistName ? (
              <Text
                variant='title'
                strength='weak'
                tag='h2'
                className={cn(fadeIn)}
                textAlign='left'
              >
                <Text color='subdued'>{messages.by}</Text>
                {userId !== null ? (
                  <UserLink userId={userId} popover variant='visible' />
                ) : null}
              </Text>
            ) : null}
          </Flex>
          {isLoading ? (
            <Skeleton css={{ position: 'absolute', top: 0 }} width='60%' />
          ) : null}
          <div>{renderStatsRow(isLoading)}</div>
        </Flex>
        <ClientOnly>
          <CollectionActionButtons
            variant={variant}
            userId={userId}
            collectionId={collectionId}
            isPlayable={isPlayable}
            isPlaying={playing}
            isPremium={isPremium}
            isOwner={isOwner}
            tracksLoading={tracksLoading}
            onPlay={onPlay}
          />
        </ClientOnly>
      </Flex>
      {onFilterChange ? (
        <Flex
          w='240px'
          css={{
            position: 'absolute',
            top: spacing.l,
            right: spacing.l
          }}
        >
          <TextInput
            label={
              type === 'album' ? messages.filterAlbum : messages.filterPlaylist
            }
            placeholder={
              type === 'album' ? messages.filterAlbum : messages.filterPlaylist
            }
            startIcon={IconSearch}
            onChange={handleFilterChange}
            value={filterText}
            size={TextInputSize.SMALL}
            className={styles.searchInput}
          />
        </Flex>
      ) : null}
    </Flex>
  )

  const descriptionSection = (
    <Flex
      gap='xl'
      direction='column'
      p='xl'
      backgroundColor='surface1'
      borderTop='strong'
      borderBottom='strong'
    >
      {isPremiumAlbumsEnabled && isStreamGated && streamConditions ? (
        <GatedContentSection
          isLoading={isLoading}
          contentId={collectionId}
          contentType={PurchaseableContentType.ALBUM}
          streamConditions={streamConditions}
          hasStreamAccess={hasStreamAccess}
          isOwner={ownerId === currentUserId}
          ownerId={ownerId}
        />
      ) : null}

      <Flex className={cn(fadeIn)} gap='l' direction='column'>
        {description ? (
          <UserGeneratedText
            size='xs'
            className={cn(fadeIn)}
            linkSource='collection page'
            css={{ textAlign: 'left' }}
          >
            {description}
          </UserGeneratedText>
        ) : null}
        <Text
          variant='body'
          size='s'
          strength='strong'
          textAlign='left'
          color='default'
        >
          {renderAlbumDetailsText()}
        </Text>
      </Flex>
    </Flex>
  )
  return (
    <Flex direction='column'>
      {topSection}
      {descriptionSection}
    </Flex>
  )
}
