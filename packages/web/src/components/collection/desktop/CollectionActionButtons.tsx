import { Variant, SmartCollectionVariant, ID } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import cn from 'classnames'

import styles from './CollectionHeader.module.css'
import { OwnerActionButtons } from './OwnerActionButtons'
import { PlayButton } from './PlayButton'
import { SmartCollectionActionButtons } from './SmartCollectionActionButtons'
import { ViewerActionButtons } from './ViewerActionButtons'

const messages = {
  actionGroupLabel: 'collection actions'
}

type CollectionActionButtonProps = {
  collectionId: ID | SmartCollectionVariant
  variant?: Variant
  isOwner?: boolean
  onPlay: () => void
  playing: boolean
  isPlayable: boolean
  userId: ID
  tracksLoading: boolean
}

export const CollectionActionButtons = (props: CollectionActionButtonProps) => {
  const {
    variant,
    isOwner,
    collectionId,
    onPlay,
    playing,
    isPlayable,
    userId,
    tracksLoading
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
    <div
      className={cn(styles.actionButtons, {
        [styles.show]: !tracksLoading,
        [styles.hide]: tracksLoading
      })}
      role='group'
      aria-label={messages.actionGroupLabel}
    >
      {!isPlayable ? null : <PlayButton onPlay={onPlay} playing={playing} />}
      {actionButtons}
    </div>
  )
}
