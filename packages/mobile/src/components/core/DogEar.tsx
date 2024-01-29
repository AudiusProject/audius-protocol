import { DogEarType } from '@audius/common'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'

import {
  IconCart,
  IconCollectible,
  IconHidden,
  IconSpecialAccess,
  IconStar
} from '@audius/harmony-native'
import DogEarRectangle from 'app/assets/images/dogEarRectangle.svg'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing }) => ({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    width: spacing(12),
    height: spacing(12),
    overflow: 'hidden',
    borderRadius: spacing(2)
  },

  rectangle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: spacing(12),
    height: spacing(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.25,
    shadowRadius: spacing(2)
  },

  icon: {
    position: 'absolute',
    width: spacing(4),
    height: spacing(4),
    top: spacing(1),
    left: spacing(1)
  }
}))

export type DogEarProps = {
  borderOffset?: number
  type: DogEarType
  style?: ViewStyle
}

export const DogEar = (props: DogEarProps) => {
  const { borderOffset, type, style } = props
  const styles = useStyles()
  const {
    neutral,
    neutralLight3,
    pageHeaderGradientColor2,
    secondary,
    staticWhite,
    accentBlue,
    specialLightGreen
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
    [DogEarType.COLLECTIBLE_GATED]: {
      icon: IconCollectible,
      colors: [accentBlue, accentBlue]
    },
    [DogEarType.SPECIAL_ACCESS]: {
      icon: IconSpecialAccess,
      colors: [accentBlue, accentBlue]
    },
    [DogEarType.USDC_PURCHASE]: {
      icon: IconCart,
      colors: [specialLightGreen, specialLightGreen]
    }
  }[type]

  const borderOffsetStyle = borderOffset
    ? { left: -borderOffset, top: -borderOffset }
    : undefined

  return (
    <View style={[styles.container, borderOffsetStyle, style]}>
      <DogEarRectangle fill={colors[0]} style={styles.rectangle} />
      <Icon
        width={spacing(4)}
        height={spacing(4)}
        fill={staticWhite}
        style={styles.icon}
      />
    </View>
  )
}
