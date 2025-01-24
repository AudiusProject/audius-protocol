import type { ComponentType } from 'react'
import { useCallback } from 'react'

import type {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  ViewStyle
} from 'react-native'
import { Animated, Image, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import type { SvgProps } from 'react-native-svg'

import IconAudioRewardsPill from 'app/assets/images/iconAudioRewardsPill.svg'
import { Pressable } from 'app/components/core'
import Text from 'app/components/text'
import { useNavigation } from 'app/hooks/useNavigation'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import type { ExploreTabScreenParamList } from 'app/screens/app-screen/ExploreTabScreen'
import { font, makeStyles } from 'app/styles'

import type { CollectionScreen, MoodScreen } from '../collections'
import type { SmartCollectionScreen } from '../smartCollections'

type ColorTileProps = {
  style?: StyleProp<ViewStyle>
  title: string
  screen: MoodScreen | CollectionScreen | SmartCollectionScreen
  description?: string
  gradientColors?: string[]
  gradientAngle?: number
  shadowColor?: string
  shadowOpacity?: number
  icon?: ComponentType<SvgProps>
  emoji?: ImageSourcePropType
  isIncentivized?: boolean
}

const useStyles = makeStyles(({ palette }) => ({
  shadowContainer: {
    elevation: 4,
    shadowOffset: { height: 2, width: 0 },
    shadowRadius: 4
  },

  gradientContainer: {
    borderRadius: 8
  },

  colorTile: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    height: 200,
    overflow: 'hidden',
    padding: 16,
    position: 'relative'
  },
  hasEmoji: {
    height: 128,
    textAlign: 'center'
  },

  title: {
    ...font('heavy'),
    color: palette.inverse,
    fontSize: 20,
    letterSpacing: 0.25,
    lineHeight: 26,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowRadius: 3,
    textShadowOffset: { height: 2, width: 0 },
    textTransform: 'uppercase'
  },
  emojiTitle: {
    marginTop: 8,
    textAlign: 'center',
    textShadowRadius: 10,
    textTransform: 'none'
  },

  description: {
    ...font('medium'),
    color: palette.inverse,
    fontSize: 16,
    letterSpacing: 0.2,
    lineHeight: 23,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowRadius: 3,
    textShadowOffset: { height: 2, width: 0 }
  },

  emoji: {
    position: 'relative',
    height: 40,
    width: 40,
    marginTop: -6
  },

  icon: {
    position: 'absolute',
    right: -60,
    top: -45
  },
  iconSvg: {
    opacity: 0.5
  },

  rewardsPill: {
    bottom: 13,
    left: 16,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  }
}))

export const ColorTile = ({
  style,
  title,
  screen,
  description,
  gradientColors = [],
  gradientAngle = 0,
  shadowColor = '#000',
  shadowOpacity = 0.25,
  icon: Icon,
  emoji,
  isIncentivized
}: ColorTileProps) => {
  const styles = useStyles()
  const navigation = useNavigation<ExploreTabScreenParamList>()
  const {
    scale,
    handlePressIn: handlePressInScale,
    handlePressOut: handlePressOutScale
  } = usePressScaleAnimation()

  const handlePress = useCallback(() => {
    if (screen) {
      navigation.push(screen)
    }
  }, [navigation, screen])

  return (
    <Animated.View
      style={[
        styles.shadowContainer,
        { shadowColor, shadowOpacity, transform: [{ scale }] },
        style
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        useAngle
        angle={gradientAngle}
        style={styles.gradientContainer}
      >
        <Pressable
          style={[styles.colorTile, !!emoji && styles.hasEmoji]}
          onPress={handlePress}
          onPressIn={handlePressInScale}
          onPressOut={handlePressOutScale}
        >
          <View style={{ backgroundColor: 'transparent' }}>
            <Text style={[styles.title, !!emoji && styles.emojiTitle]}>
              {title}
            </Text>
            <Text style={styles.description}>{description}</Text>
            {emoji && (
              <View style={{ display: 'flex', alignItems: 'center' }}>
                <Image
                  style={styles.emoji as ImageStyle}
                  source={emoji as ImageSourcePropType}
                />
              </View>
            )}
            {Icon && (
              <View style={styles.icon}>
                <Icon
                  style={styles.iconSvg}
                  height={260}
                  width={260}
                  color='inverse'
                />
              </View>
            )}
          </View>
          {isIncentivized ? (
            <View style={styles.rewardsPill}>
              <IconAudioRewardsPill />
            </View>
          ) : null}
        </Pressable>
      </LinearGradient>
    </Animated.View>
  )
}
