import { View, StyleSheet } from 'react-native'

import IconFavoriteOffDark from 'app/assets/animations/iconFavoriteOffDark.json'
import IconFavoriteOffLight from 'app/assets/animations/iconFavoriteOffLight.json'
import IconFavoriteOnDark from 'app/assets/animations/iconFavoriteOnDark.json'
import IconFavoriteOnLight from 'app/assets/animations/iconFavoriteOnLight.json'
import IconRepostOffDark from 'app/assets/animations/iconRepostOffDark.json'
import IconRepostOffLight from 'app/assets/animations/iconRepostOffLight.json'
import IconRepostOnDark from 'app/assets/animations/iconRepostOnDark.json'
import IconRepostOnLight from 'app/assets/animations/iconRepostOnLight.json'
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
    animatedIcon: {
      width: 28,
      height: 28
    },
    icon: {
      width: 24,
      height: 24
    }
  })

export const ActionsBar = () => {
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
    return (
      <AnimatedButtonProvider
        isDarkMode={isDarkMode}
        iconLightJSON={[IconRepostOnLight, IconRepostOffLight]}
        iconDarkJSON={[IconRepostOnDark, IconRepostOffDark]}
        onPress={() => {}}
        style={styles.button}
        wrapperStyle={styles.animatedIcon}
      />
    )
  }
  const renderFavoriteButton = () => {
    return (
      <AnimatedButtonProvider
        isDarkMode={isDarkMode}
        iconLightJSON={[IconFavoriteOnLight, IconFavoriteOffLight]}
        iconDarkJSON={[IconFavoriteOnDark, IconFavoriteOffDark]}
        onPress={() => {}}
        style={styles.button}
        wrapperStyle={styles.animatedIcon}
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
