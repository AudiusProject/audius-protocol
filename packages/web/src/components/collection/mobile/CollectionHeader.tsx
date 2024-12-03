import { memo, useCallback } from 'react'

import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import {
  useGatedContentAccessMap,
  useGatedContentAccess
} from '@audius/common/hooks'
import { Variant, SquareSizes, ID, ModalSource } from '@audius/common/models'
import {
  CommonState,
  cacheCollectionsSelectors,
  OverflowAction,
  PurchaseableContentType
} from '@audius/common/store'
import { dayjs, formatReleaseDate } from '@audius/common/utils'
import {
  Box,
  Button,
  Flex,
  IconCalendarMonth,
  IconPause,
  IconPlay,
  IconVisibilityHidden,
  MusicBadge,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom-v5-compat'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { UserLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { GatedContentSection } from 'components/track/GatedContentSection'
import { UserGeneratedText } from 'components/user-generated-text'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import ActionButtonRow from 'pages/track-page/components/mobile/ActionButtonRow'
import { isShareToastDisabled } from 'utils/clipboardUtil'
import { isDarkMode } from 'utils/theme/theme'

import { CollectionDogEar } from '../CollectionDogEar'
import { CollectionMetadataList } from '../CollectionMetadataList'
import { RepostsFavoritesStats } from '../components/RepostsFavoritesStats'
import { CollectionHeaderProps } from '../types'

import styles from './CollectionHeader.module.css'

const { getCollectionTracks } = cacheCollectionsSelectors

const messages = {
  hiddenPlaylist: 'Hidden Playlist',
  publishing: 'Publishing...',
  play: 'PLAY',
  pause: 'PAUSE',
  preview: 'PREVIEW',
  coverArtAltText: 'Collection Cover Art',
  hidden: 'Hidden',
  releases: (releaseDate: string) =>
    `Releases ${formatReleaseDate({ date: releaseDate, withHour: true })}`
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
  isPlayable,
  streamConditions,
  access,
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
  const navigate = useNavigate()

  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: collection } = useGetPlaylistById({
    playlistId: collectionId,
    currentUserId
  })
  const { hasStreamAccess } = useGatedContentAccess(collection)
  const {
    is_private: isPrivate,
    is_stream_gated: isPremium,
    is_scheduled_release: isScheduledRelease,
    release_date: releaseDate,
    permalink
  } = collection ?? {}

  const tracks = useSelector((state: CommonState) =>
    getCollectionTracks(state, { id: collectionId })
  )
  const trackAccessMap = useGatedContentAccessMap(tracks ?? [])
  const doesUserHaveAccessToAnyTrack = Object.values(trackAccessMap).some(
    ({ hasStreamAccess }) => hasStreamAccess
  )

  // Show play if user has access to the collection or any of its contents,
  // otherwise show preview
  const shouldShowPlay =
    (isPlayable && hasStreamAccess) || doesUserHaveAccessToAnyTrack
  const shouldShowPreview = isPremium && !hasStreamAccess && !shouldShowPlay

  const showPremiumSection = isAlbum && streamConditions && collectionId
  const shouldShowStats =
    isPublished && variant !== Variant.SMART && (!isPrivate || isOwner)
  const shouldShowScheduledRelease =
    isScheduledRelease && releaseDate && dayjs(releaseDate).isAfter(dayjs())

  const onSaveCollection = () => {
    if (!isOwner) onSave?.()
  }

  const onClickOverflow = () => {
    const overflowActions = [
      isOwner || !isPublished || !hasStreamAccess
        ? null
        : isReposted
        ? OverflowAction.UNREPOST
        : OverflowAction.REPOST,
      isOwner || !isPublished || !hasStreamAccess
        ? null
        : isSaved
        ? OverflowAction.UNFAVORITE
        : OverflowAction.FAVORITE,
      isOwner && !isPublished ? OverflowAction.PUBLISH_PLAYLIST : null,
      isOwner && !ddexApp
        ? isAlbum
          ? OverflowAction.DELETE_ALBUM
          : OverflowAction.DELETE_PLAYLIST
        : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

    onClickMobileOverflow?.(collectionId, overflowActions)
  }

  const image = useCollectionCoverArt({
    collectionId,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const handleClickEdit = useCallback(() => {
    navigate({ pathname: `${permalink}/edit`, search: `?focus=artwork` })
  }, [navigate, permalink])

  if (loading) {
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
      {loading ? null : <CollectionDogEar collectionId={collectionId} />}
      <Flex direction='column' alignItems='center' p='l' gap='l'>
        {!isPublished ? (
          shouldShowScheduledRelease ? (
            <MusicBadge variant='accent' icon={IconCalendarMonth} size='s'>
              {messages.releases(releaseDate)}
            </MusicBadge>
          ) : (
            <MusicBadge icon={IconVisibilityHidden} size='s'>
              {messages.hidden}
            </MusicBadge>
          )
        ) : null}
        <DynamicImage
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
        </DynamicImage>
        <Flex gap='xs' direction='column' alignItems='center'>
          <Text variant='heading' size='s' tag='h1'>
            {title}
          </Text>
          {userId ? (
            <UserLink userId={userId} size='l' variant='visible' />
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
          showFavorite={!!onSave && !isOwner && hasStreamAccess && !isPrivate}
          showRepost={
            variant !== Variant.SMART &&
            !isOwner &&
            hasStreamAccess &&
            !isPrivate
          }
          showShare={
            (variant !== Variant.SMART || type === 'Audio NFT Playlist') &&
            !isPrivate
          }
          showOverflow={variant !== Variant.SMART && !isPrivate}
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
        {showPremiumSection ? (
          <Box w='100%'>
            <GatedContentSection
              isLoading={loading}
              contentId={collectionId}
              contentType={PurchaseableContentType.ALBUM}
              streamConditions={streamConditions}
              hasStreamAccess={!!access?.stream}
              isOwner={isOwner}
              wrapperClassName={styles.gatedContentSectionWrapper}
              buttonClassName={styles.gatedContentSectionButton}
              ownerId={userId}
              source={ModalSource.CollectionDetails}
            />
          </Box>
        ) : null}
        {shouldShowStats ? (
          <RepostsFavoritesStats
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
        <CollectionMetadataList collectionId={collectionId} />
      </Flex>
    </Flex>
  )
}

export default memo(CollectionHeader)
