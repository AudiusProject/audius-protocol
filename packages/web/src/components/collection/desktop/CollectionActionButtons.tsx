import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import {
  useGatedContentAccess,
  useGatedContentAccessMap
} from '@audius/common/hooks'
import { Variant, SmartCollectionVariant, ID } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { Button, Flex, IconPause, IconPlay } from '@audius/harmony'
import cn from 'classnames'

import styles from './CollectionHeader.module.css'
import { OwnerActionButtons } from './OwnerActionButtons'
import { SmartCollectionActionButtons } from './SmartCollectionActionButtons'
import { ViewerActionButtons } from './ViewerActionButtons'
import { BUTTON_COLLAPSE_WIDTHS } from './utils'

const messages = {
  actionGroupLabel: 'collection actions',
  play: 'Play',
  preview: 'Preview',
  pause: 'Pause'
}

type CollectionActionButtonProps = {
  collectionId: ID | SmartCollectionVariant
  variant?: Nullable<Variant>
  isOwner?: boolean
  isPlaying: boolean
  isPreviewing: boolean
  tracksLoading: boolean
  isPlayable: boolean
  isPremium?: Nullable<boolean>
  userId: Nullable<ID>
  onPlay: () => void
  onPreview: () => void
}

export const CollectionActionButtons = (props: CollectionActionButtonProps) => {
  const {
    variant,
    isOwner,
    collectionId,
    onPlay,
    onPreview,
    isPlaying,
    isPlayable,
    isPreviewing,
    userId,
    tracksLoading,
    isPremium
  } = props

  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: collection } = useGetPlaylistById(
    {
      playlistId: typeof collectionId === 'number' ? collectionId : null,
      currentUserId
    },
    { disabled: typeof collectionId !== 'number' }
  )
  const { hasStreamAccess } = useGatedContentAccess(collection)
  const accessMap = useGatedContentAccessMap(collection?.tracks ?? [])
  const hasAccessToSomeTracks = Object.values(accessMap).some(
    (hasStreamAccess) => hasStreamAccess
  )

  // If user doesn't have access, show preview only. If user has access, show play only.
  // If user is owner, show both.
  const shouldShowPlay =
    (isPlayable && hasStreamAccess) || hasAccessToSomeTracks
  const shouldShowPreview = isOwner
    ? isPlayable && isPremium
    : isPremium && !hasStreamAccess && !hasAccessToSomeTracks

  let actionButtons: Nullable<JSX.Element> = null

  if (typeof collectionId !== 'number') {
    if (variant === Variant.SMART) {
      actionButtons = (
        <SmartCollectionActionButtons
          collectionId={collectionId}
          userId={userId}
        />
      )
    }
  } else if (isOwner) {
    actionButtons = <OwnerActionButtons collectionId={collectionId} />
  } else {
    actionButtons = <ViewerActionButtons collectionId={collectionId} />
  }

  const playButton = (
    <Button
      variant='primary'
      iconLeft={isPlaying && !isPreviewing ? IconPause : IconPlay}
      onClick={onPlay}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
      size='large'
    >
      {isPlaying && !isPreviewing ? messages.pause : messages.play}
    </Button>
  )

  const previewButton = (
    <Button
      variant='secondary'
      iconLeft={isPlaying && isPreviewing ? IconPause : IconPlay}
      onClick={onPreview}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
      size='large'
    >
      {isPlaying && isPreviewing ? messages.pause : messages.preview}
    </Button>
  )

  return (
    <Flex
      className={cn({
        [styles.show]: !tracksLoading,
        [styles.hide]: tracksLoading
      })}
      role='group'
      aria-label={messages.actionGroupLabel}
      gap='2xl'
      alignItems='center'
    >
      {shouldShowPlay ? playButton : null}
      {shouldShowPreview ? previewButton : null}
      {actionButtons}
    </Flex>
  )
}
