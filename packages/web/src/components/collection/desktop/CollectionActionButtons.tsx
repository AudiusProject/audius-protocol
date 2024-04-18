import { Variant, SmartCollectionVariant, ID } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { Button, Flex, IconPause, IconPlay } from '@audius/harmony'
import cn from 'classnames'

import styles from './CollectionHeader.module.css'
import { OwnerActionButtons } from './OwnerActionButtons'
import { SmartCollectionActionButtons } from './SmartCollectionActionButtons'
import { ViewerActionButtons } from './ViewerActionButtons'
import { BUTTON_COLLAPSE_WIDTHS } from './utils'
import { MouseEventHandler } from 'react'

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
  onPlay: MouseEventHandler<HTMLButtonElement>
  playing: boolean
  isPlayable: boolean
  isPremium: Nullable<boolean>
  userId: Nullable<ID>
  tracksLoading: boolean
}

export const CollectionActionButtons = (props: CollectionActionButtonProps) => {
  const {
    variant,
    isOwner,
    collectionId,
    onPlay,
    playing: isPlaying,
    isPlayable,
    userId,
    tracksLoading,
    isPremium
  } = props

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
      {!isPlayable ? null : (
        <Button
          variant={isPremium ? 'secondary' : 'primary'}
          iconLeft={isPlaying ? IconPause : IconPlay}
          onClick={onPlay}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
        >
          {isPlaying
            ? messages.pause
            : isPremium
              ? messages.preview
              : messages.play}
        </Button>
      )}
      {actionButtons}
    </Flex>
  )
}
