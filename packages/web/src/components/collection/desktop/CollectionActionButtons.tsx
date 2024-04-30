import { MouseEventHandler } from 'react'

import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
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
  tracksLoading: boolean
  isPlayable: boolean
  isPremium?: Nullable<boolean>
  userId: Nullable<ID>
  onPlay: MouseEventHandler<HTMLButtonElement>
}

export const CollectionActionButtons = (props: CollectionActionButtonProps) => {
  const {
    variant,
    isOwner,
    collectionId,
    onPlay,
    isPlaying,
    isPlayable,
    userId,
    tracksLoading,
    isPremium
  } = props

  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: collection } = useGetPlaylistById({
    playlistId: typeof collectionId === 'number' ? collectionId : -1,
    currentUserId
  })
  const { hasStreamAccess } = useGatedContentAccess(collection)
  const shouldShowPreview = isPremium && hasStreamAccess

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
      variant={shouldShowPreview ? 'secondary' : 'primary'}
      iconLeft={isPlaying ? IconPause : IconPlay}
      onClick={onPlay}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
    >
      {isPlaying
        ? messages.pause
        : shouldShowPreview
        ? messages.preview
        : messages.play}
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
      {!isPlayable ? null : playButton}
      {actionButtons}
    </Flex>
  )
}
