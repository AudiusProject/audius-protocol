import { ImageStyle, StyleSheet, View } from 'react-native'

import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import { IconButton } from 'app/components/core'
import FavoriteButton from 'app/components/favorite-button'
import RepostButton from 'app/components/repost-button'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
import { GestureResponderHandler } from 'app/types/gesture'
import { ThemeColors, useThemeColors } from 'app/utils/theme'

type Props = {
  disabled?: boolean
  hasReposted?: boolean
  hasSaved?: boolean
  isOwner?: boolean
  isShareHidden?: boolean
  isUnlisted?: boolean
  onPressOverflow?: GestureResponderHandler
  onPressRepost?: GestureResponderHandler
  onPressSave?: GestureResponderHandler
  onPressShare?: GestureResponderHandler
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    bottomButtons: {
      ...flexRowCentered(),
      justifyContent: 'space-between',
      marginVertical: 2,
      marginHorizontal: 12,
      height: 36,
      borderTopWidth: 1,
      borderTopColor: themeColors.neutralLight8
    },
    button: {
      marginHorizontal: 16
    },
    firstButton: {
      marginLeft: 0
    },
    leftButtons: {
      ...flexRowCentered()
    },
    lastButton: {
      marginRight: 0
    }
  })

export const LineupTileActionButtons = ({
  disabled,
  hasReposted,
  hasSaved,
  isOwner,
  isShareHidden,
  isUnlisted,
  onPressOverflow,
  onPressRepost,
  onPressSave,
  onPressShare
}: Props) => {
  const { neutralLight4 } = useThemeColors()
  const styles = useThemedStyles(createStyles)

  const repostButton = (
    <RepostButton
      onPress={onPressRepost}
      isActive={hasReposted}
      isDisabled={disabled || isOwner}
      style={[styles.button, styles.firstButton] as ImageStyle}
    />
  )

  const favoriteButton = (
    <FavoriteButton
      onPress={onPressSave}
      isActive={hasSaved}
      isDisabled={disabled || isOwner}
      style={styles.button as ImageStyle}
    />
  )

  const shareButton = (
    <IconButton
      fill={neutralLight4}
      icon={IconShare}
      isDisabled={disabled}
      onPress={onPressShare}
      styles={{ root: styles.button }}
    />
  )

  const moreButton = (
    <IconButton
      fill={neutralLight4}
      icon={IconKebabHorizontal}
      isDisabled={disabled}
      onPress={onPressOverflow}
      styles={{ root: styles.lastButton, icon: { height: 22, width: 22 } }}
    />
  )

  return (
    <View
      style={styles.bottomButtons}
      // Capture touches to prevent from triggering play
      onStartShouldSetResponder={() => true}
      onTouchEnd={e => e.stopPropagation()}
    >
      <View style={styles.leftButtons}>
        {!isUnlisted && (
          <>
            {repostButton}
            {favoriteButton}
            {!isShareHidden && shareButton}
          </>
        )}
      </View>
      {moreButton}
    </View>
  )
}
