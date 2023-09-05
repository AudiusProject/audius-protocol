import { View } from 'react-native'

import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import { IconButton } from 'app/components/core'
import { FavoriteButton } from 'app/components/favorite-button'
import { RepostButton } from 'app/components/repost-button'
import { flexRowCentered, makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'
import { useThemeColors } from 'app/utils/theme'

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

const useStyles = makeStyles(({ spacing, palette }) => ({
  bottomButtons: {
    ...flexRowCentered(),
    justifyContent: 'space-between',
    marginVertical: spacing(0.5),
    marginHorizontal: spacing(3),
    height: spacing(9),
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight8
  },
  button: {
    height: 22,
    width: 22
  },
  buttonMargin: {
    marginRight: spacing(8)
  },
  leftButtons: {
    ...flexRowCentered()
  }
}))

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
  const styles = useStyles()

  const repostButton = (
    <View style={[styles.button, styles.buttonMargin]}>
      <RepostButton
        onPress={onPressRepost}
        isActive={hasReposted}
        isDisabled={disabled || isOwner}
      />
    </View>
  )

  const favoriteButton = (
    <View style={[styles.button, styles.buttonMargin]}>
      <FavoriteButton
        onPress={onPressSave}
        isActive={hasSaved}
        isDisabled={disabled || isOwner}
      />
    </View>
  )

  const shareButton = (
    <IconButton
      fill={neutralLight4}
      icon={IconShare}
      isDisabled={disabled}
      onPress={onPressShare}
    />
  )

  const moreButton = (
    <IconButton
      fill={neutralLight4}
      icon={IconKebabHorizontal}
      isDisabled={disabled}
      onPress={onPressOverflow}
      styles={{ icon: styles.button }}
    />
  )

  return (
    <View style={styles.bottomButtons}>
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
