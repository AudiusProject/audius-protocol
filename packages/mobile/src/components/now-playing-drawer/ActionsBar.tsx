import React from 'react'

import { View, StyleSheet } from 'react-native'

import IconShuffleOffDark from 'app/assets/animations/iconShuffleOffDark.json'
import IconShuffleOffLight from 'app/assets/animations/iconShuffleOffLight.json'
import IconShuffleOnDark from 'app/assets/animations/iconShuffleOnDark.json'
import IconShuffleOnLight from 'app/assets/animations/iconShuffleOnLight.json'
import IconAirplay from 'app/assets/images/iconAirplay.svg'
import IconChromecast from 'app/assets/images/iconChromecast.svg'
import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import AnimatedButtonProvider from 'app/components/animated-button/AnimatedButtonProvider'
import IconButton from 'app/components/icon-button'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { Theme, ThemeColors, useThemeVariant } from 'app/utils/theme'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 40,
      height: 48,
      borderRadius: 10,
      backgroundColor: themeColors.neutralLight8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly'
    },
    button: {
      flexGrow: 1,
      display: 'flex',
      alignItems: 'center'
    },
    icon: {
      width: 24,
      height: 24
    }
  })

const ActionsBar = () => {
  const styles = useThemedStyles(createStyles)
  const themeVariant = useThemeVariant()
  const isDarkMode = themeVariant === Theme.DARK

  const renderCastButton = () => {
    // TODO: Use selector web this
    const isAirplay = true
    if (isAirplay) {
      return (
        <IconButton
          icon={IconAirplay}
          containerStyle={styles.button}
          style={styles.icon}
        />
      )
    }
    return (
      <IconButton
        icon={IconChromecast}
        containerStyle={styles.button}
        style={styles.icon}
      />
    )
  }
  const renderRepostButton = () => {
    // TODO: Switch for repost assets
    return (
      <AnimatedButtonProvider
        isDarkMode={isDarkMode}
        iconLightJSON={[IconShuffleOnLight, IconShuffleOffLight]}
        iconDarkJSON={[IconShuffleOnDark, IconShuffleOffDark]}
        onPress={() => {}}
        style={styles.button}
        wrapperStyle={styles.icon}
      />
    )
  }
  const renderFavoriteButton = () => {
    // TODO: Switch for favorite assets
    return (
      <AnimatedButtonProvider
        isDarkMode={isDarkMode}
        iconLightJSON={[IconShuffleOnLight, IconShuffleOffLight]}
        iconDarkJSON={[IconShuffleOnDark, IconShuffleOffDark]}
        onPress={() => {}}
        style={styles.button}
        wrapperStyle={styles.icon}
      />
    )
  }
  const renderShareButton = () => {
    return (
      <IconButton
        icon={IconShare}
        containerStyle={styles.button}
        style={styles.icon}
      />
    )
  }
  const renderOptionsButton = () => {
    return (
      <IconButton
        icon={IconKebabHorizontal}
        containerStyle={styles.button}
        style={styles.icon}
      />
    )
  }
  return (
    <View style={styles.container}>
      {renderCastButton()}
      {renderRepostButton()}
      {renderFavoriteButton()}
      {renderShareButton()}
      {renderOptionsButton()}
    </View>
  )
}

export default ActionsBar
