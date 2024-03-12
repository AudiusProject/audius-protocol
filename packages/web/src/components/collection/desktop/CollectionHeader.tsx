import { ChangeEvent, useCallback, useState } from 'react'

import { useGetCurrentUserId, useGetPurchases } from '@audius/common/api'
import { useAllPaginatedQuery } from '@audius/common/audius-query'
import { useEditPlaylistModal } from '@audius/common/store'
import { formatSecondsAsText, formatDate } from '@audius/common/utils'
import {
  Text,
  IconFilter,
  IconVisibilityHidden,
  IconPencil,
  Flex
} from '@audius/harmony'
import cn from 'classnames'

import { Input } from 'components/input'
import { UserLink } from 'components/link'
import RepostFavoritesStats from 'components/repost-favorites-stats/RepostFavoritesStats'
import Skeleton from 'components/skeleton/Skeleton'
import { GatedTrackSection } from 'components/track/GatedTrackSection'
import InfoLabel from 'components/track/InfoLabel'
import { UserGeneratedText } from 'components/user-generated-text'

import { Artwork } from './Artwork'
import { CollectionActionButtons } from './CollectionActionButtons'
import styles from './CollectionHeader.module.css'

const messages = {
  filter: 'Filter Tracks'
}

// TODO: move all props to leaves
type CollectionHeaderProps = any

export const CollectionHeader = (props: CollectionHeaderProps) => {
  const {
    collectionId,
    ownerId,
    type,
    title,
    coverArtSizes,
    artistName,
    description,
    isOwner,
    modified,
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

  const [artworkLoading, setIsArtworkLoading] = useState(true)
  const [filterText, setFilterText] = useState('')

  const { data: currentUserId } = useGetCurrentUserId({})

  const { data: purchases, hasMore: hasMorePurchases } = useAllPaginatedQuery(
    useGetPurchases,
    {
      userId: currentUserId
    },
    {
      pageSize: 100
    }
  )

  const isAlbumPurchased = purchases.some(
    (purchaseDetails) =>
      purchaseDetails.contentType === 'album' &&
      purchaseDetails.contentId === collectionId
  )

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
        className={styles.statsWrapper}
      />
    )
  }

  const isLoading = loading || artworkLoading

  const fadeIn = {
    [styles.show]: !isLoading,
    [styles.hide]: isLoading
  }

  const TitleComponent = isOwner ? 'button' : 'span'

  return (
    <Flex className={styles.collectionHeader} direction='column' gap='m'>
      <div className={styles.topSection}>
        <Artwork
          collectionId={collectionId}
          coverArtSizes={coverArtSizes}
          callback={handleLoadArtwork}
          gradient={gradient}
          icon={icon}
          imageOverride={imageOverride}
          isOwner={isOwner}
        />
        <div className={styles.infoSection}>
          <span className={cn(styles.typeLabel, fadeIn)}>
            {!isPublished ? (
              <IconVisibilityHidden className={styles.labelIcon} />
            ) : null}
            <p className={styles.label}>
              {type === 'playlist' && !isPublished ? 'hidden playlist' : type}
            </p>
          </span>
          <TitleComponent
            className={cn(styles.title, { [styles.editableTitle]: isOwner })}
            onClick={isOwner ? handleClickEditTitle : undefined}
          >
            <Text
              variant='heading'
              size='xl'
              className={cn(styles.titleHeader, fadeIn)}
            >
              {title}
            </Text>
            {isOwner ? <IconPencil className={styles.editIcon} /> : null}
            {isLoading ? <Skeleton className={styles.skeleton} /> : null}
          </TitleComponent>
          <Flex>
            {artistName ? (
              <Text
                variant='title'
                strength='weak'
                tag='h2'
                className={cn(fadeIn)}
              >
                <Text color='subdued'>By </Text>
                <UserLink userId={userId} popover />
              </Text>
            ) : null}
            {isLoading ? (
              <Skeleton className={styles.skeleton} width='60%' />
            ) : null}
          </Flex>

          <div className={cn(styles.infoLabelsSection, fadeIn)}>
            {modified && (
              <InfoLabel
                className={styles.infoLabelPlacement}
                labelName='modified'
                labelValue={formatDate(modified)}
              />
            )}
            {duration ? (
              <InfoLabel
                className={styles.infoLabelPlacement}
                labelName='duration'
                labelValue={formatSecondsAsText(duration)}
              />
            ) : null}
            <InfoLabel
              className={styles.infoLabelPlacement}
              labelName='tracks'
              labelValue={numTracks}
            />
          </div>
          <UserGeneratedText
            size='xs'
            className={cn(styles.description, fadeIn)}
            linkSource='collection page'
          >
            {description}
          </UserGeneratedText>
          <div className={cn(styles.statsRow, fadeIn)}>
            {renderStatsRow(isLoading)}
          </div>
          <CollectionActionButtons
            playing={playing}
            variant={variant}
            isOwner={isOwner}
            userId={userId}
            collectionId={collectionId}
            onPlay={onPlay}
            isPlayable={isPlayable}
            tracksLoading={tracksLoading}
          />
        </div>
        {onFilterChange ? (
          <div className={styles.inputWrapper}>
            <Input
              placeholder={messages.filter}
              prefix={<IconFilter color='subdued' />}
              onChange={handleFilterChange}
              value={filterText}
              size='small'
              variant='bordered'
            />
          </div>
        ) : null}
      </div>
      {isStreamGated && streamConditions ? (
        <GatedTrackSection
          isLoading={hasMorePurchases}
          // TODO: rename prop
          trackId={collectionId}
          streamConditions={streamConditions}
          hasStreamAccess={isAlbumPurchased}
          isOwner={ownerId === currentUserId}
          ownerId={ownerId}
        />
      ) : null}
    </Flex>
  )
}
