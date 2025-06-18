import { useCollection, useCollectionTracks } from '@audius/common/api'
import {
  useGatedContentAccess,
  useGatedContentAccessMap
} from '@audius/common/hooks'
import { Variant, SmartCollectionVariant, ID } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { Button, Flex, IconPause, IconPlay } from '@audius/harmony'
import cn from 'classnames'
import { pick } from 'lodash'

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
    userId,
    tracksLoading,
    isPremium
  } = props

  const { data: partialCollection } = useCollection(collectionId as number, {
    enabled: typeof collectionId === 'number',
    select: (collection) =>
      pick(collection, [
        'playlist_id',
        'is_stream_gated',
        'access',
        'stream_conditions'
      ])
  })
  const { hasStreamAccess } = useGatedContentAccess(partialCollection)
  // Dirty hack to get around the possibility that collectionId is a SmartCollectionVariant
  const { data: tracks } = useCollectionTracks(
    typeof collectionId === 'number' ? collectionId : null
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
      iconLeft={isPlaying ? IconPause : IconPlay}
      onClick={onPlay}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
      size='large'
    >
      {isPlaying ? messages.pause : messages.play}
    </Button>
  )

  const previewButton = (
    <Button
      variant='secondary'
      iconLeft={isPlaying ? IconPause : IconPlay}
      onClick={onPreview}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
      size='large'
    >
      {isPlaying ? messages.pause : messages.preview}
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
      gap='xl'
      alignItems='center'
    >
      {shouldShowPlay ? playButton : null}
      {shouldShowPreview ? previewButton : null}
      {actionButtons}
    </Flex>
  )
}
