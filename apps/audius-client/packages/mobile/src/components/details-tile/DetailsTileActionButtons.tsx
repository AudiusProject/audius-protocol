import { StyleSheet, View } from 'react-native'

import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import { IconButton } from 'app/components/core'
import { FavoriteButton } from 'app/components/favorite-button'
import { RepostButton } from 'app/components/repost-button'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'
import type { ThemeColors } from 'app/utils/theme'
import { useThemeColors } from 'app/utils/theme'

type DetailsTileActionButtonsProps = {
  hasReposted: boolean
  hasSaved: boolean
  isOwner: boolean
  isPublished?: boolean
  hideFavorite?: boolean
  hideOverflow?: boolean
  hideRepost?: boolean
  hideShare?: boolean
  onPressRepost?: GestureResponderHandler
  onPressSave?: GestureResponderHandler
  onPressShare?: GestureResponderHandler
  onPressOverflow?: GestureResponderHandler
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      ...flexRowCentered(),
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: themeColors.neutralLight7,
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
  })

/**
 * The action buttons on track and playlist screens
 */
export const DetailsTileActionButtons = ({
  hasReposted,
  hasSaved,
  isOwner,
  isPublished = true,
  hideFavorite,
  hideOverflow,
  hideRepost,
  hideShare,
  onPressOverflow,
  onPressRepost,
  onPressSave,
  onPressShare
}: DetailsTileActionButtonsProps) => {
  const styles = useThemedStyles(createStyles)
  const { neutralLight4 } = useThemeColors()

  const repostButton = (
    <RepostButton
      wrapperStyle={styles.actionButton}
      onPress={onPressRepost}
      isActive={hasReposted}
      isDisabled={isOwner}
    />
  )

  const favoriteButton = (
    <FavoriteButton
      wrapperStyle={styles.actionButton}
      onPress={onPressSave}
      isActive={hasSaved}
      isDisabled={isOwner}
    />
  )

  const shareButton = (
    <IconButton
      fill={neutralLight4}
      icon={IconShare}
      isDisabled={!isPublished}
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

  return (
    <View style={styles.root}>
      {hideRepost ? null : repostButton}
      {hideFavorite ? null : favoriteButton}
      {hideShare ? null : shareButton}
      {hideOverflow ? null : overflowMenu}
    </View>
  )
}
