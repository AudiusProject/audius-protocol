import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import IconCollectible from 'app/assets/images/iconCollectible.svg'
import IconHidden from 'app/assets/images/iconHidden.svg'
import IconLock from 'app/assets/images/iconLock.svg'
import IconSpecialAccess from 'app/assets/images/iconSpecialAccess.svg'
import IconStar from 'app/assets/images/iconStar.svg'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing }) => ({
  bannerIcon: {
    position: 'absolute',
    zIndex: 10,
    width: 80,
    height: 80,
    overflow: 'hidden',
    borderRadius: spacing(2),

    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3
  },

  container: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }, { translateX: -68 }],
    width: spacing(20),
    height: spacing(20)
  },
  icon: {
    marginTop: spacing(1),
    marginLeft: spacing(1)
  }
}))

export enum DogEarType {
  STAR = 'star',
  HIDDEN = 'hidden',
  LOCKED = 'locked',
  COLLECTIBLE_GATED = 'collectible gated',
  SPECIAL_ACCESS = 'special access'
}

type DogEarProps = {
  type: DogEarType
  style?: ViewStyle
}

export const DogEar = (props: DogEarProps) => {
  const { type, style } = props
  const styles = useStyles()
  const {
    neutral,
    neutralLight3,
    pageHeaderGradientColor2,
    secondary,
    staticWhite,
    accentBlue
  } = useThemeColors()

  const { icon: Icon, colors } = {
    [DogEarType.STAR]: {
      icon: IconStar,
      colors: [secondary, pageHeaderGradientColor2]
    },
    [DogEarType.HIDDEN]: {
      icon: IconHidden,
      colors: [neutral, neutralLight3]
    },
    [DogEarType.LOCKED]: {
      icon: IconLock,
      colors: [accentBlue, accentBlue]
    },
    [DogEarType.COLLECTIBLE_GATED]: {
      icon: IconCollectible,
      colors: [accentBlue, accentBlue]
    },
    [DogEarType.SPECIAL_ACCESS]: {
      icon: IconSpecialAccess,
      colors: [accentBlue, accentBlue]
    }
  }[type]

  return (
    <View style={[styles.bannerIcon, style]}>
      <LinearGradient
        colors={colors}
        style={[styles.container]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
      <Icon fill={staticWhite} height={16} width={16} style={styles.icon} />
    </View>
  )
}
