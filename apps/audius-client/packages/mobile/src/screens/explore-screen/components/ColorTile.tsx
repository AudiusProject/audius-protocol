import { ComponentType, ReactNode, useCallback } from 'react'

import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { SvgProps } from 'react-native-svg'

import IconAudioRewardsPill from 'app/assets/images/iconAudioRewardsPill.svg'
import { ExploreStackParamList } from 'app/components/app-navigator/types'
import Text from 'app/components/text'
import { useNavigation } from 'app/hooks/useNavigation'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { font } from 'app/styles'
import { ThemeColors } from 'app/utils/theme'

type ColorTileProps = {
  style?: StyleProp<ViewStyle>
  title: string
  link: string
  screen?: 'TrendingUnderground' | 'UnderTheRadar'
  description?: string
  gradientColors?: string[]
  gradientAngle?: number
  shadowColor?: string
  shadowOpacity?: number
  icon?: ComponentType<SvgProps>
  emoji?: ReactNode
  isIncentivized?: boolean
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
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
      color: themeColors.staticWhite,
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
      color: themeColors.staticWhite,
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
  })

export const ColorTile = ({
  style,
  title,
  link,
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
  const styles = useThemedStyles(createStyles)
  const navigation = useNavigation<ExploreStackParamList>()

  const handlePress = useCallback(() => {
    if (screen) {
      navigation.push({
        native: { screen, params: undefined },
        web: { route: link }
      })
    }
  }, [navigation, screen, link])

  return (
    <View
      style={[styles.shadowContainer, { shadowColor, shadowOpacity }, style]}
    >
      <LinearGradient
        colors={gradientColors}
        useAngle
        angle={gradientAngle}
        style={styles.gradientContainer}
      >
        <TouchableOpacity
          style={[styles.colorTile, !!emoji && styles.hasEmoji]}
          onPress={handlePress}
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
                {/* @ts-ignore */}
                <Icon style={styles.iconSvg} height={260} width={260} />
              </View>
            )}
          </View>
          {isIncentivized ? (
            <View style={styles.rewardsPill}>
              <IconAudioRewardsPill />
            </View>
          ) : null}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  )
}
