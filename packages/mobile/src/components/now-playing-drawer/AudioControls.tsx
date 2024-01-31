import { useCallback } from 'react'

import { FeatureFlags } from '@audius/common/services'
import {
  queueActions,
  queueSelectors,
  RepeatMode,
  modalsActions
} from '@audius/common/store'
import { Animated, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconNext from 'app/assets/images/iconNext.svg'
import IconPodcastBack from 'app/assets/images/iconPodcastBack.svg'
import IconPodcastForward from 'app/assets/images/iconPodcastForward.svg'
import IconPrev from 'app/assets/images/iconPrev.svg'
import { IconButton } from 'app/components/core'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'

import { PlayButton } from './PlayButton'
import { PlaybackRateButton } from './PlaybackRateButton'
import { RepeatButton } from './RepeatButton'
import { ShuffleButton } from './ShuffleButton'

const { setVisibility } = modalsActions
const { getRepeat, getShuffle } = queueSelectors
const { shuffle, repeat } = queueActions

const useStyles = makeStyles(({ spacing }) => ({
  container: {
    marginTop: spacing(10),
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
  emptyPlaceholder: {
    minHeight: 24,
    minWidth: 24,
    flexGrow: 1
  },
  playbackIconContainer: {
    height: 24,
    width: 24,
    flexGrow: 1,
    marginTop: spacing(1),
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
}))

type AudioControlsProps = {
  onNext: () => void
  onPrevious: () => void
  isLongFormContent?: boolean
}

export const AudioControls = ({
  onNext,
  onPrevious,
  isLongFormContent = false
}: AudioControlsProps) => {
  const dispatch = useDispatch()

  const { isEnabled: isNewPodcastControlsEnabled } = useFeatureFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  const styles = useStyles()

  const shuffleEnabled = useSelector(getShuffle)
  const repeatMode = useSelector(getRepeat)

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
    dispatch(shuffle({ enable }))
  }, [dispatch, shuffleEnabled])

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
    dispatch(repeat({ mode }))
  }, [dispatch, repeatMode])

  const handlePressPlaybackRate = useCallback(() => {
    dispatch(setVisibility({ modal: 'PlaybackRate', visible: true }))
  }, [dispatch])

  const renderRepeatButton = () => {
    return isLongFormContent && isNewPodcastControlsEnabled ? (
      <View style={styles.emptyPlaceholder} />
    ) : (
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
        icon={isLongFormContent ? IconPodcastBack : IconPrev}
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
        icon={isLongFormContent ? IconPodcastForward : IconNext}
        styles={{ root: styles.button, icon: styles.nextPrevIcons }}
      />
    )
  }
  const renderRightButton = () => {
    return isLongFormContent && isNewPodcastControlsEnabled ? (
      <View style={styles.playbackIconContainer}>
        <PlaybackRateButton
          onPress={handlePressPlaybackRate}
          style={styles.button}
        />
      </View>
    ) : (
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
      {renderRightButton()}
    </View>
  )
}
