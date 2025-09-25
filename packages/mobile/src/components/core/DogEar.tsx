import { DogEarType } from '@audius/common/models'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import Svg, {
  Path,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop
} from 'react-native-svg'

import {
  IconArtistCoin,
  IconCart,
  IconCollectible,
  IconReceive,
  IconSparkles,
  useTheme
} from '@audius/harmony-native'
import DogEarRectangle from 'app/assets/images/dogEarRectangle.svg'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'
import { zIndex } from 'app/utils/zIndex'

const CoinGradientDogEarSvg = ({
  gradientColors,
  style
}: {
  gradientColors: string[]
  style: ViewStyle
}) => {
  return (
    <Svg style={style} width='48' height='48' viewBox='0 0 48 48' fill='none'>
      <G filter='url(#filter0_d_2088_1481)'>
        <Path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M0 8C0 3.58172 3.58172 0 8 0H40L0 40V8Z'
          fill='url(#coinGradient)'
        />
        <Path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M0 8C0 3.58172 3.58172 0 8 0H40L0 40V8Z'
          fill='url(#paint0_radial_2088_1481)'
          fillOpacity='0.2'
        />
        <Path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M0 8C0 3.58172 3.58172 0 8 0H40L0 40V8Z'
          fill='url(#paint1_radial_2088_1481)'
          fillOpacity='0.2'
        />
      </G>

      <Defs>
        <RadialGradient
          id='paint0_radial_2088_1481'
          cx='0'
          cy='0'
          r='1'
          gradientUnits='userSpaceOnUse'
          gradientTransform='scale(33 11.7534)'
        >
          <Stop stopColor='white' />
          <Stop offset='1' stopColor='white' stopOpacity='0' />
        </RadialGradient>

        <RadialGradient
          id='paint1_radial_2088_1481'
          cx='0'
          cy='0'
          r='1'
          gradientUnits='userSpaceOnUse'
          gradientTransform='rotate(90) scale(36.5 13)'
        >
          <Stop stopColor='white' />
          <Stop offset='1' stopColor='white' stopOpacity='0' />
        </RadialGradient>

        <LinearGradient id='coinGradient' gradientTransform='rotate(-5)'>
          <Stop stopColor={gradientColors[0]} offset='-4.82%' />
          <Stop stopColor={gradientColors[1]} offset='49.8%' />
          <Stop stopColor={gradientColors[2]} offset='104.43%' />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}

const useStyles = makeStyles(({ spacing }) => ({
  container: {
    position: 'absolute',
    top: -1,
    left: -1,
    zIndex: zIndex.DOG_EAR,
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
    shadowRadius: spacing(2),
    zIndex: zIndex.DOG_EAR
  },

  icon: {
    position: 'absolute',
    width: spacing(4),
    height: spacing(4),
    top: spacing(1),
    left: spacing(1),
    zIndex: zIndex.DOG_EAR
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
  const { color } = useTheme()
  const gradientColors = color.special.coinGradient.colors
  const { staticWhite, accentBlue, specialLightGreen } = useThemeColors()

  const { icon: Icon, colors } = {
    [DogEarType.COLLECTIBLE_GATED]: {
      icon: IconCollectible,
      colors: [accentBlue, accentBlue]
    },
    [DogEarType.SPECIAL_ACCESS]: {
      icon: IconSparkles,
      colors: [accentBlue, accentBlue]
    },
    [DogEarType.TOKEN_GATED]: {
      icon: IconArtistCoin
    },
    [DogEarType.USDC_PURCHASE]: {
      icon: IconCart,
      colors: [specialLightGreen, specialLightGreen]
    },
    [DogEarType.USDC_EXTRAS]: {
      icon: IconReceive,
      colors: [specialLightGreen, specialLightGreen]
    }
  }[type]

  const borderOffsetStyle = borderOffset
    ? { left: -borderOffset, top: -borderOffset }
    : undefined

  return (
    <View style={[styles.container, borderOffsetStyle, style]}>
      {type === DogEarType.TOKEN_GATED ? (
        <CoinGradientDogEarSvg
          gradientColors={gradientColors}
          style={styles.rectangle}
        />
      ) : (
        <DogEarRectangle fill={colors[0]} style={styles.rectangle} />
      )}
      <Icon
        width={spacing(4)}
        height={spacing(4)}
        fill={staticWhite}
        style={styles.icon}
      />
    </View>
  )
}
