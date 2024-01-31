import { ChangeEvent, useCallback, useState } from 'react'

import { useEditPlaylistModal } from '@audius/common/store'

import {} from '@audius/common'
import { formatSecondsAsText, formatDate } from '@audius/common/utils'
import { IconHidden, IconPencil } from '@audius/stems'
import cn from 'classnames'

import IconFilter from 'assets/img/iconFilter.svg'
import { Input } from 'components/input'
import { UserLink } from 'components/link'
import RepostFavoritesStats from 'components/repost-favorites-stats/RepostFavoritesStats'
import Skeleton from 'components/skeleton/Skeleton'
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
    type,
    title,
    coverArtSizes,
    artistName,
    description,
    isOwner,
    modified,
    numTracks,
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
    onClickFavorites
  } = props

  const [artworkLoading, setIsArtworkLoading] = useState(true)
  const [filterText, setFilterText] = useState('')

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
    <div className={styles.collectionHeader}>
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
            {!isPublished ? <IconHidden className={styles.labelIcon} /> : null}
            <p className={styles.label}>
              {type === 'playlist' && !isPublished ? 'hidden playlist' : type}
            </p>
          </span>
          <TitleComponent
            className={cn(styles.title, { [styles.editableTitle]: isOwner })}
            onClick={isOwner ? handleClickEditTitle : undefined}
          >
            <h1 className={cn(styles.titleHeader, fadeIn)}>{title}</h1>
            {isOwner ? <IconPencil className={styles.editIcon} /> : null}
            {isLoading ? <Skeleton className={styles.skeleton} /> : null}
          </TitleComponent>
          {artistName && (
            <div className={styles.artistWrapper}>
              <div className={cn(fadeIn)}>
                <span>By </span>
                <UserLink
                  userId={userId}
                  strength='strong'
                  popover
                  textAs='h2'
                />
              </div>
              {isLoading && (
                <Skeleton className={styles.skeleton} width='60%' />
              )}
            </div>
          )}
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
            size='xSmall'
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
            isEmptyPlaylist={numTracks === 0}
            tracksLoading={tracksLoading}
          />
        </div>
        {onFilterChange ? (
          <div className={styles.inputWrapper}>
            <Input
              placeholder={messages.filter}
              prefix={<IconFilter />}
              onChange={handleFilterChange}
              value={filterText}
              size='small'
              variant='bordered'
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
