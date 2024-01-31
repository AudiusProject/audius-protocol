import { useGetPlaylistById, useGetCurrentUserId } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { cacheCollectionsSelectors } from '@audius/common/store'
import type { CommonState } from '@audius/common/store'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconPencil from 'app/assets/images/iconPencil.svg'
import IconRocket from 'app/assets/images/iconRocket.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import { IconButton } from 'app/components/core'
import { FavoriteButton } from 'app/components/favorite-button'
import { RepostButton } from 'app/components/repost-button'
import { makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'
import { useThemeColors } from 'app/utils/theme'

const { getCollecitonHasHiddenTracks, getIsCollectionEmpty } =
  cacheCollectionsSelectors

const messages = {
  publishButtonEmptyDisabledContent: 'You must add at least 1 track.',
  publishButtonHiddenDisabledContent:
    'You cannot make a playlist with hidden tracks public.',
  shareButtonDisabledContent: 'You can’t share an empty playlist.'
}

type DetailsTileActionButtonsProps = {
  collectionId?: ID
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
  root: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing(8),
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight7,
    paddingBottom: spacing(4)
  },
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
  const { neutralLight4 } = useThemeColors()
  const isCollectionEmpty = useSelector((state: CommonState) =>
    getIsCollectionEmpty(state, { id: collectionId })
  )
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: collection } = useGetPlaylistById(
    {
      playlistId: collectionId!,
      currentUserId
    },
    { disabled: !collectionId || !isCollection }
  )
  const collectionHasHiddenTracks = useSelector((state: CommonState) =>
    getCollecitonHasHiddenTracks(state, { id: collectionId })
  )
  const { isEnabled: isEditAlbumsEnabled } = useFeatureFlag(
    FeatureFlags.EDIT_ALBUMS
  )

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
      fill={neutralLight4}
      icon={IconShare}
      isDisabled={isCollectionEmpty}
      disabledPressToastContent={messages.shareButtonDisabledContent}
      onPress={onPressShare}
      styles={{ icon: [styles.actionButton] }}
    />
  )

  const overflowMenu = (
    <IconButton
      fill={neutralLight4}
      icon={IconKebabHorizontal}
      onPress={onPressOverflow}
      styles={{ icon: styles.actionButton }}
    />
  )

  const editButton = (
    <IconButton
      fill={neutralLight4}
      icon={IconPencil}
      onPress={onPressEdit}
      styles={{ icon: styles.actionButton }}
    />
  )

  const publishButton = (
    <IconButton
      fill={neutralLight4}
      icon={IconRocket}
      isDisabled={isCollectionEmpty || collectionHasHiddenTracks}
      disabledPressToastContent={
        collectionHasHiddenTracks
          ? messages.publishButtonHiddenDisabledContent
          : messages.publishButtonEmptyDisabledContent
      }
      onPress={onPressPublish}
      styles={{ icon: styles.actionButton }}
    />
  )

  const isAlbum = isCollection && collection?.is_album
  const isCollectionOwner = isCollection && isOwner

  return (
    <View style={styles.root}>
      {isCollectionOwner
        ? !isAlbum || isEditAlbumsEnabled
          ? editButton
          : null
        : hideRepost
        ? null
        : repostButton}
      {isCollectionOwner || hideFavorite ? null : favoriteButton}
      {hideShare ? null : shareButton}
      {isCollectionOwner && !isPublished && (!isAlbum || isEditAlbumsEnabled)
        ? publishButton
        : null}
      {hideOverflow ? null : overflowMenu}
    </View>
  )
}
