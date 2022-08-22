import { useCallback } from 'react'

import { queueActions, RepeatMode } from '@audius/common'
import { getRepeat, getShuffle } from 'common/store/queue/selectors'
import { Animated, View, StyleSheet } from 'react-native'

import IconNext from 'app/assets/images/iconNext.svg'
import IconPodcastBack from 'app/assets/images/iconPodcastBack.svg'
import IconPodcastForward from 'app/assets/images/iconPodcastForward.svg'
import IconPrev from 'app/assets/images/iconPrev.svg'
import { IconButton } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ThemeColors } from 'app/utils/theme'

import { PlayButton } from './PlayButton'
import { RepeatButton } from './RepeatButton'
import { ShuffleButton } from './ShuffleButton'
const { shuffle, repeat } = queueActions

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

type AudioControlsProps = {
  onNext: () => void
  onPrevious: () => void
  isPodcast?: boolean
}

export const AudioControls = ({
  onNext,
  onPrevious,
  isPodcast = false
}: AudioControlsProps) => {
  const dispatchWeb = useDispatchWeb()

  const styles = useThemedStyles(createStyles)

  const shuffleEnabled = useSelectorWeb(getShuffle)
  const repeatMode = useSelectorWeb(getRepeat)

  const {
    scale,
    handlePressIn: handlePressInScale,
    handlePressOut: handlePressOutScale
  } = usePressScaleAnimation()

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
      default:
        // To appease ts - shouldn't actually hit this.
        mode = RepeatMode.ALL
    }
    dispatchWeb(repeat({ mode }))
  }, [dispatchWeb, repeatMode])

  const renderRepeatButton = () => {
    return (
      <RepeatButton
        onPress={onPressRepeat}
        style={styles.button}
        wrapperStyle={styles.shuffleRepeatIcons}
      />
    )
  }
  const renderPreviousButton = () => {
    return (
      <IconButton
        onPress={onPrevious}
        icon={isPodcast ? IconPodcastBack : IconPrev}
        styles={{ root: styles.button, icon: styles.nextPrevIcons }}
      />
    )
  }
  const renderPlayButton = () => {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <PlayButton
          onPressIn={handlePressInScale}
          onPressOut={handlePressOutScale}
          style={styles.button}
          wrapperStyle={styles.playIcon}
        />
      </Animated.View>
    )
  }
  const renderNextButton = () => {
    return (
      <IconButton
        onPress={onNext}
        icon={isPodcast ? IconPodcastForward : IconNext}
        styles={{ root: styles.button, icon: styles.nextPrevIcons }}
      />
    )
  }
  const renderShuffleButton = () => {
    return (
      <ShuffleButton
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
