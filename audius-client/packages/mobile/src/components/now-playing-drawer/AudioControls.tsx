import { useCallback } from 'react'

import { getRepeat, getShuffle } from 'common/store/queue/selectors'
import { shuffle, repeat } from 'common/store/queue/slice'
import { RepeatMode } from 'common/store/queue/types'
import { View, StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconPause from 'app/assets/animations/iconPause.json'
import IconPlay from 'app/assets/animations/iconPlay.json'
import IconRepeatAllDark from 'app/assets/animations/iconRepeatAllDark.json'
import IconRepeatAllLight from 'app/assets/animations/iconRepeatAllLight.json'
import IconRepeatOffDark from 'app/assets/animations/iconRepeatOffDark.json'
import IconRepeatOffLight from 'app/assets/animations/iconRepeatOffLight.json'
import IconRepeatSingleDark from 'app/assets/animations/iconRepeatSingleDark.json'
import IconRepeatSingleLight from 'app/assets/animations/iconRepeatSingleLight.json'
import IconShuffleOffDark from 'app/assets/animations/iconShuffleOffDark.json'
import IconShuffleOffLight from 'app/assets/animations/iconShuffleOffLight.json'
import IconShuffleOnDark from 'app/assets/animations/iconShuffleOnDark.json'
import IconShuffleOnLight from 'app/assets/animations/iconShuffleOnLight.json'
import IconNext from 'app/assets/images/iconNext.svg'
import IconPrev from 'app/assets/images/iconPrev.svg'
import AnimatedButtonProvider from 'app/components/animated-button/AnimatedButtonProvider'
import { IconButton } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { pause, play } from 'app/store/audio/actions'
import { getPlaying } from 'app/store/audio/selectors'
import { Theme, ThemeColors, useThemeVariant } from 'app/utils/theme'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 40,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly'
    },
    button: {
      flexGrow: 1,
      display: 'flex',
      alignItems: 'center'
    },
    playIcon: {
      width: 80,
      height: 80
    },
    nextPrevIcons: {
      width: 30,
      height: 30
    },
    shuffleRepeatIcons: {
      width: 24,
      height: 24
    }
  })

export const AudioControls = () => {
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()

  const styles = useThemedStyles(createStyles)
  const themeVariant = useThemeVariant()
  const isDarkMode = themeVariant === Theme.DARK

  const isPlaying = useSelector(getPlaying)
  const shuffleEnabled = useSelectorWeb(getShuffle)
  const repeatMode = useSelectorWeb(getRepeat)

  const onPressPlayButton = useCallback(() => {
    if (isPlaying) {
      dispatch(pause())
    } else {
      dispatch(play())
    }
  }, [isPlaying, dispatch])

  const onPressShuffle = useCallback(() => {
    let enable: boolean
    if (shuffleEnabled) {
      enable = false
    } else {
      enable = true
    }
    dispatchWeb(shuffle({ enable }))
  }, [dispatchWeb, shuffleEnabled])

  const onPressRepeat = useCallback(() => {
    let mode: RepeatMode
    switch (repeatMode) {
      case RepeatMode.ALL:
        mode = RepeatMode.SINGLE
        break
      case RepeatMode.OFF:
        mode = RepeatMode.ALL
        break
      case RepeatMode.SINGLE:
        mode = RepeatMode.OFF
        break
    }
    dispatchWeb(repeat({ mode }))
  }, [dispatchWeb, repeatMode])

  const renderRepeatButton = () => {
    return (
      <AnimatedButtonProvider
        isDarkMode={isDarkMode}
        iconLightJSON={[
          IconRepeatAllLight,
          IconRepeatSingleLight,
          IconRepeatOffLight
        ]}
        iconDarkJSON={[
          IconRepeatAllDark,
          IconRepeatSingleDark,
          IconRepeatOffDark
        ]}
        onPress={onPressRepeat}
        style={styles.button}
        wrapperStyle={styles.shuffleRepeatIcons}
      />
    )
  }
  const renderPreviousButton = () => {
    return (
      <IconButton
        icon={IconPrev}
        styles={{ root: styles.button, icon: styles.nextPrevIcons }}
      />
    )
  }
  const renderPlayButton = () => {
    return (
      <AnimatedButtonProvider
        isDarkMode={isDarkMode}
        isActive={isPlaying}
        iconLightJSON={[IconPlay, IconPause]}
        iconDarkJSON={[IconPlay, IconPause]}
        onPress={onPressPlayButton}
        style={styles.button}
        wrapperStyle={styles.playIcon}
      />
    )
  }
  const renderNextButton = () => {
    return (
      <IconButton
        icon={IconNext}
        styles={{ root: styles.button, icon: styles.nextPrevIcons }}
      />
    )
  }
  const renderShuffleButton = () => {
    return (
      <AnimatedButtonProvider
        isDarkMode={isDarkMode}
        iconLightJSON={[IconShuffleOnLight, IconShuffleOffLight]}
        iconDarkJSON={[IconShuffleOnDark, IconShuffleOffDark]}
        onPress={onPressShuffle}
        style={styles.button}
        wrapperStyle={styles.shuffleRepeatIcons}
      />
    )
  }
  return (
    <View style={styles.container}>
      {renderRepeatButton()}
      {renderPreviousButton()}
      {renderPlayButton()}
      {renderNextButton()}
      {renderShuffleButton()}
    </View>
  )
}
