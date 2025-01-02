import { useGetPlaylistById, useCurrentUserId } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { cacheCollectionsSelectors } from '@audius/common/store'
import type { CommonState } from '@audius/common/store'
import { useSelector } from 'react-redux'

import {
  Flex,
  IconButton,
  IconKebabHorizontal,
  IconPencil,
  IconRocket,
  IconShare
} from '@audius/harmony-native'
import { FavoriteButton } from 'app/components/favorite-button'
import { RepostButton } from 'app/components/repost-button'
import { makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'

const { getCollectionHasHiddenTracks, getIsCollectionEmpty } =
  cacheCollectionsSelectors

const getMessages = (collectionType: 'album' | 'playlist') => ({
  publishButtonEmptyDisabledContent: 'You must add at least 1 track.',
  publishButtonHiddenDisabledContent: `You cannot make a ${collectionType} with hidden tracks public.`,
  shareButtonDisabledHint: `You can’t share an empty ${collectionType}.`,
  shareButtonLabel: 'Share Content',
  overflowButtonLabel: 'More Options',
  editButtonLabel: 'Edit Content',
  publishButtonLabel: 'Publish Content'
})

type DetailsTileActionButtonsProps = {
  collectionId?: ID
  ddexApp?: string | null
  hasReposted: boolean
  hasSaved: boolean
  isOwner: boolean
  isCollection?: boolean
  isPublished?: boolean
  hideFavorite?: boolean
  hideOverflow?: boolean
  hideRepost?: boolean
  hideShare?: boolean
  onPressEdit?: GestureResponderHandler
  onPressPublish?: GestureResponderHandler
  onPressRepost?: GestureResponderHandler
  onPressSave?: GestureResponderHandler
  onPressShare?: GestureResponderHandler
  onPressOverflow?: GestureResponderHandler
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  actionButton: {
    width: spacing(8),
    height: spacing(8)
  }
}))

/**
 * The action buttons on track and playlist screens
 */
export const DetailsTileActionButtons = ({
  collectionId,
  ddexApp,
  hasReposted,
  hasSaved,
  isCollection,
  isOwner,
  isPublished,
  hideFavorite,
  hideOverflow,
  hideRepost,
  hideShare,
  onPressEdit,
  onPressPublish,
  onPressOverflow,
  onPressRepost,
  onPressSave,
  onPressShare
}: DetailsTileActionButtonsProps) => {
  const styles = useStyles()
  const isCollectionEmpty = useSelector((state: CommonState) =>
    getIsCollectionEmpty(state, { id: collectionId })
  )
  const { data: currentUserId } = useCurrentUserId()
  const { data: collection } = useGetPlaylistById(
    {
      playlistId: collectionId!,
      currentUserId
    },
    { disabled: !collectionId || !isCollection }
  )
  const collectionHasHiddenTracks = useSelector((state: CommonState) =>
    getCollectionHasHiddenTracks(state, { id: collectionId })
  )
  const messages = getMessages(collection?.is_album ? 'album' : 'playlist')

  const repostButton = (
    <RepostButton
      wrapperStyle={styles.actionButton}
      onPress={onPressRepost}
      isActive={!isOwner && hasReposted}
      isDisabled={isOwner}
    />
  )

  const favoriteButton = (
    <FavoriteButton
      wrapperStyle={styles.actionButton}
      onPress={onPressSave}
      isActive={!isOwner && hasSaved}
      isDisabled={isOwner}
    />
  )

  const shareButton = (
    <IconButton
      color='subdued'
      // TODO: Remove after AnimatedButton uses IconButton
      icon={IconShare}
      disabled={isCollectionEmpty}
      disabledHint={messages.shareButtonDisabledHint}
      onPress={onPressShare}
      aria-label={messages.shareButtonLabel}
      size='2xl'
      // TODO: Remove after AnimatedButton uses IconButton
      style={{ padding: 0 }}
    />
  )

  const overflowMenu = (
    <IconButton
      color='subdued'
      icon={IconKebabHorizontal}
      onPress={onPressOverflow}
      aria-label={messages.overflowButtonLabel}
      size='2xl'
      // TODO: Remove after AnimatedButton uses IconButton
      style={{ padding: 0 }}
    />
  )

  const editButton = (
    <IconButton
      color='subdued'
      icon={IconPencil}
      onPress={onPressEdit}
      aria-label={messages.editButtonLabel}
      size='2xl'
    />
  )

  const publishButton = (
    <IconButton
      color='subdued'
      icon={IconRocket}
      disabled={isCollectionEmpty}
      disabledHint={
        collectionHasHiddenTracks
          ? messages.publishButtonHiddenDisabledContent
          : messages.publishButtonEmptyDisabledContent
      }
      aria-label={messages.publishButtonLabel}
      onPress={onPressPublish}
      size='2xl'
    />
  )

  return (
    <Flex direction='row' justifyContent='center' gap='xl'>
      {isOwner || ddexApp || hideRepost ? null : repostButton}
      {isOwner || hideFavorite ? null : favoriteButton}
      {hideShare ? null : shareButton}
      {isOwner && !ddexApp ? editButton : null}
      {isOwner && !isPublished ? publishButton : null}
      {hideOverflow ? null : overflowMenu}
    </Flex>
  )
}
