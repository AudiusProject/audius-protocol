import { ChangeEvent, MouseEventHandler, useCallback, useState } from 'react'

import { useGetCurrentUserId } from '@audius/common/api'
import {
  AccessConditions,
  AccessPermissions,
  CoverArtSizes,
  ID,
  ImageSizesObject,
  SquareSizes,
  Variant,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  CollectionPageTrackRecord,
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
  TextLink,
  IconComponent
} from '@audius/harmony'
import cn from 'classnames'

import { ClientOnly } from 'components/client-only/ClientOnly'
import { UserLink } from 'components/link'
import RepostFavoritesStats from 'components/repost-favorites-stats/RepostFavoritesStats'
import Skeleton from 'components/skeleton/Skeleton'
import { GatedContentSection } from 'components/track/GatedContentSection'
import { UserGeneratedText } from 'components/user-generated-text'
import { useFlag } from 'hooks/useRemoteConfig'
import { useSsrContext } from 'ssr/SsrContext'

import { Artwork } from './Artwork'
import { CollectionActionButtons } from './CollectionActionButtons'
import styles from './CollectionHeader.module.css'

const messages = {
  filter: 'Filter Tracks'
}

// TODO: move all props to leaves
type CollectionHeaderProps = {
  isStreamGated: boolean | null
  isPlayable: boolean
  isPublished: boolean
  tracksLoading: boolean
  loading: boolean
  playing: boolean
  isOwner: boolean
  isAlbum: boolean
  access: AccessPermissions | null
  collectionId: ID
  ownerId: ID | null
  type: CollectionsPageType | 'Playlist' | 'Audio NFT Playlist'
  title: string
  coverArtSizes: CoverArtSizes | null
  artistName: string
  description: string
  artistHandle: string
  releaseDate: string | number // either format should be utc time
  lastModifiedDate?: string | number // either format should be utc time
  numTracks: number
  duration: number
  variant: Variant | null
  gradient?: string
  icon: IconComponent
  imageOverride?: string
  userId: ID | null
  reposts: number
  saves: number
  streamConditions: AccessConditions | null
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

  const TitleComponent = isOwner ? 'button' : 'span'

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

  return (
    <Flex direction='column'>
      {/* Top Section */}
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
                {isPremium ? 'premium ' : ''}
                {type === 'playlist' && !isPublished ? 'hidden playlist' : type}
              </Text>
            </Flex>
            <Flex direction='column' gap='s'>
              <TitleComponent
                className={cn(styles.title, {
                  [styles.editableTitle]: isOwner
                })}
                css={{
                  outline: 0,
                  border: 0,
                  background: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.s,
                  padding: 0,
                }}
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
              </TitleComponent>
              {artistName ? (
                <Text
                  variant='title'
                  strength='weak'
                  tag='h2'
                  className={cn(fadeIn)}
                  textAlign='left'
                >
                  <Text color='subdued'>By </Text>
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
              playing={playing}
              variant={variant}
              isOwner={isOwner}
              userId={userId}
              collectionId={collectionId}
              onPlay={onPlay}
              isPlayable={isPlayable}
              tracksLoading={tracksLoading}
              isPremium={isPremium}
            />
          </ClientOnly>
        </Flex>
        {onFilterChange ? (
          <Flex
            css={{
              position: 'absolute',
              top: spacing.l,
              right: spacing.l,
              width: '240px'
            }}
          >
            <TextInput
              label='Search in playlist...'
              placeholder={messages.filter}
              startIcon={IconSearch}
              onChange={handleFilterChange}
              value={filterText}
              size={TextInputSize.SMALL}
            />
          </Flex>
        ) : null}
      </Flex>

      {/* Description section */}
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
            css={{ margin: 0 }}
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
          <Flex>
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
      </Flex>
    </Flex>
  )
}
