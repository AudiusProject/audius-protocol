import { FeatureFlags } from '@audius/common'
import { View } from 'react-native'

import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconPencil from 'app/assets/images/iconPencil.svg'
import IconRocket from 'app/assets/images/iconRocket.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import { IconButton } from 'app/components/core'
import { FavoriteButton } from 'app/components/favorite-button'
import { RepostButton } from 'app/components/repost-button'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { flexRowCentered, makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'
import { useThemeColors } from 'app/utils/theme'

// const messages = {
//   publishButtonDisabledContent: 'You must add at least 1 track.',
//   shareButtonDisabledContent: 'You can’t share an empty playlist.'
// }

type DetailsTileActionButtonsProps = {
  hasReposted: boolean
  hasSaved: boolean
  isOwner: boolean
  isPlaylist?: boolean
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

const useStyles = makeStyles(({ palette }) => ({
  root: {
    ...flexRowCentered(),
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight7,
    height: 60,
    paddingTop: 12,
    paddingBottom: 8
  },

  actionButton: {
    ...flexRowCentered(),
    width: 30,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
    bottom: 1,
    marginHorizontal: 16
  }
}))

/**
 * The action buttons on track and playlist screens
 */
export const DetailsTileActionButtons = ({
  hasReposted,
  hasSaved,
  isPlaylist,
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
  const { isEnabled: isPlaylistUpdatesEnabled } = useFeatureFlag(
    FeatureFlags.PLAYLIST_UPDATES_PRE_QA
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
      isDisabled={!isPublished}
      // TODO: Add isDisabled based on if playlist is publishable logic
      // Needs to check for hidden tracks and things like that
      // disabledPressToastContent={messages.shareButtonDisabledContent}
      onPress={onPressShare}
      styles={{ icon: [styles.actionButton, { height: 24, width: 24 }] }}
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
      // TODO: Add isDisabled based on if playlist is publishable logic
      // Needs to check for hidden tracks and things like that
      // isDisabled
      // disabledPressToastContent={messages.publishButtonDisabledContent}
      onPress={onPressPublish}
      styles={{ icon: styles.actionButton }}
    />
  )

  const isPlaylistOwner = isPlaylistUpdatesEnabled && isPlaylist && isOwner

  return (
    <View style={styles.root}>
      {isPlaylistOwner ? editButton : hideRepost ? null : repostButton}
      {isPlaylistOwner || hideFavorite ? null : favoriteButton}
      {hideShare ? null : shareButton}
      {isPlaylistOwner && !isPublished ? publishButton : null}
      {hideOverflow ? null : overflowMenu}
    </View>
  )
}
