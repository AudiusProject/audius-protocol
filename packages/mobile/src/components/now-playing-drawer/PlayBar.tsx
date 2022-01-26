import React from 'react'

import {
  StyleSheet,
  TouchableOpacity,
  Animated,
  View,
  Dimensions
} from 'react-native'

import IconPause from 'app/assets/animations/iconPause.json'
import IconPlay from 'app/assets/animations/iconPlay.json'
import FavoriteButton from 'app/components/favorite-button'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { Theme, ThemeColors, useThemeVariant } from 'app/utils/theme'

import AnimatedButtonProvider from '../animated-button/AnimatedButtonProvider'

import { TrackingBar } from './TrackingBar'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      width: '100%',
      height: 46,
      alignItems: 'center'
    },
    container: {
      height: '100%',
      width: '100%',
      paddingLeft: 12,
      paddingRight: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start'
    },
    button: {},
    playIcon: {
      width: 32,
      height: 32
    },
    icon: {
      width: 28,
      height: 28
    },
    trackInfo: {
      height: '100%',
      flexShrink: 1,
      flexGrow: 1,
      alignItems: 'center',
      flexDirection: 'row'
    },
    artwork: {
      marginLeft: 12,
      height: 26,
      width: 26,
      backgroundColor: 'blue',
      borderRadius: 2
    },
    trackText: {
      alignItems: 'center',
      marginLeft: 12,
      flexDirection: 'row'
    },
    title: {
      color: themeColors.neutral,
      maxWidth: Dimensions.get('window').width / 3,
      fontSize: 12
    },
    separator: {
      color: themeColors.neutral,
      marginLeft: 4,
      marginRight: 4,
      fontSize: 16
    },
    artist: {
      color: themeColors.neutral,
      maxWidth: Dimensions.get('window').width / 4,
      fontSize: 12
    }
  })

type PlayBarProps = {
  onPress: () => void
  /**
   * Opacity animation to fade out play bar as
   * the new playing drawer is dragged open.
   */
  opacityAnim: Animated.Value
}

export const PlayBar = ({ onPress, opacityAnim }: PlayBarProps) => {
  const styles = useThemedStyles(createStyles)
  const themeVariant = useThemeVariant()
  const isDarkMode = themeVariant === Theme.DARK

  const renderFavoriteButton = () => {
    return (
      <FavoriteButton
        onPress={() => {}}
        style={styles.button}
        wrapperStyle={styles.icon}
      />
    )
  }

  const renderPlayButton = () => {
    return (
      <AnimatedButtonProvider
        isDarkMode={isDarkMode}
        iconLightJSON={[IconPlay, IconPause]}
        iconDarkJSON={[IconPlay, IconPause]}
        onPress={() => {}}
        style={styles.button}
        wrapperStyle={styles.playIcon}
      />
    )
  }

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: opacityAnim.interpolate({
            // Interpolate the animation such that the play bar fades out
            // at 25% up the screen.
            inputRange: [0, 0.75, 1],
            outputRange: [0, 0, 1]
          })
        }
      ]}
    >
      <TrackingBar percentComplete={50} opacityAnim={opacityAnim} />
      <View style={styles.container}>
        {renderFavoriteButton()}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.trackInfo}
          onPress={onPress}
        >
          <View style={styles.artwork} />
          <View style={styles.trackText}>
            <Text numberOfLines={1} weight='bold' style={styles.title}>
              Crazy
            </Text>
            <Text weight='bold' style={styles.separator}>
              •
            </Text>
            <Text numberOfLines={1} weight='medium' style={styles.artist}>
              Gnarles Barkley
            </Text>
          </View>
        </TouchableOpacity>
        {renderPlayButton()}
      </View>
    </Animated.View>
  )
}
