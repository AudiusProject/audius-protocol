import { useCallback, useEffect, useRef, useState } from 'react'

import { getTrack } from 'audius-client/src/common/store/cache/tracks/selectors'
import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import {
  View,
  StyleSheet,
  Animated,
  GestureResponderEvent,
  PanResponderGestureState,
  StatusBar,
  Dimensions
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import Drawer from 'app/components/drawer'
import { Scrubber } from 'app/components/scrubber'
import { useDrawer } from 'app/hooks/useDrawer'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import {
  getPlaying,
  getTrack as getNativeTrack
} from 'app/store/audio/selectors'
import { attachToDy } from 'app/utils/animation'

import { DrawerAnimationStyle, springToValue } from '../drawer/Drawer'

import { ActionsBar } from './ActionsBar'
import { Artwork } from './Artwork'
import { AudioControls } from './AudioControls'
import { Logo } from './Logo'
import { PlayBar } from './PlayBar'
import { TitleBar } from './TitleBar'
import { TrackInfo } from './TrackInfo'

const PLAY_BAR_HEIGHT = 84
const STATUS_BAR_FADE_CUTOFF = 0.6

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    height: Dimensions.get('window').height - PLAY_BAR_HEIGHT
  },
  controlsContainer: {
    marginLeft: 24,
    marginRight: 24
  },
  titleBarContainer: {
    marginBottom: 16
  },
  artworkContainer: {
    marginBottom: 20
  },
  trackInfoContainer: {
    marginBottom: 16
  },
  scrubberContainer: {
    marginLeft: 40,
    marginRight: 40
  }
})

type NowPlayingDrawerProps = {
  onOpen: () => void
  onClose: () => void
  bottomBarTranslationAnim: Animated.Value
}

const NowPlayingDrawer = ({
  onOpen: onOpenProp,
  onClose: onCloseProp,
  bottomBarTranslationAnim
}: NowPlayingDrawerProps) => {
  const insets = useSafeAreaInsets()

  const { isOpen, onOpen, onClose } = useDrawer('NowPlaying')
  const previousIsOpen = usePrevious(isOpen)
  const isPlaying = useSelector(getPlaying)
  const [isPlayBarShowing, setIsPlayBarShowing] = useState(false)
  const [isSwipedClosed, setIsSwipedClosed] = useState(false)

  // When audio starts playing, open the playbar to the initial offset
  useEffect(() => {
    if (isPlaying && !isPlayBarShowing) {
      setIsPlayBarShowing(true)
    }
  }, [isPlaying, isPlayBarShowing])

  // Set animation opacity for the play bar as the now playing drawer is
  // opened. The top of the now playing drawer (Audius logo)
  // animates in opposite the play bar animating out while dragging up.
  const playBarOpacityAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (isOpen) {
      setIsSwipedClosed(false)
      StatusBar.setHidden(true, 'fade')
    } else {
      StatusBar.setHidden(false, 'fade')
    }
  }, [isOpen])

  const handleDrawerClose = useCallback(() => {
    springToValue(playBarOpacityAnim, 1, DrawerAnimationStyle.SPRINGY)
    setIsPlayBarShowing(true)
    onCloseProp()
  }, [setIsPlayBarShowing, onCloseProp, playBarOpacityAnim])

  const handleDrawerCloseFromSwipe = useCallback(() => {
    onClose()
    handleDrawerClose()
    setIsSwipedClosed(true)
  }, [onClose, handleDrawerClose])

  useEffect(() => {
    // drawer was requested to be closed from an external action
    if (!isOpen && previousIsOpen && !isSwipedClosed) {
      handleDrawerClose()
    }
  })

  const onDrawerOpen = useCallback(() => {
    springToValue(playBarOpacityAnim, 0, DrawerAnimationStyle.SPRINGY)
    onOpen()
    setIsPlayBarShowing(false)
    onOpenProp()
  }, [setIsPlayBarShowing, onOpen, onOpenProp, playBarOpacityAnim])

  const drawerPercentOpen = useRef(0)
  const onDrawerPercentOpen = useCallback(
    (percentOpen: number) => {
      drawerPercentOpen.current = percentOpen
    },
    [drawerPercentOpen]
  )

  // Attach to the pan responder of the drawer so that we can animate away
  // the bottom bar as the drawer is dragged open
  const onPanResponderMove = useCallback(
    (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (gestureState.dy > 0) {
        // Delta is downwards
        if (isOpen) {
          attachToDy(
            bottomBarTranslationAnim,
            drawerPercentOpen.current * 100
          )(e)
          attachToDy(playBarOpacityAnim, 1 - drawerPercentOpen.current)(e)
        }
      } else if (gestureState.dy < 0) {
        // Delta is upwards
        if (!isOpen) {
          attachToDy(
            bottomBarTranslationAnim,
            drawerPercentOpen.current * 100
          )(e)
          attachToDy(playBarOpacityAnim, 1 - drawerPercentOpen.current)(e)
        }
      }

      if (gestureState.vy > 0) {
        // Dragging downwards
        if (drawerPercentOpen.current < STATUS_BAR_FADE_CUTOFF) {
          StatusBar.setHidden(false, 'fade')
        }
      } else if (gestureState.vy < 0) {
        // Dragging upwards
        if (drawerPercentOpen.current > STATUS_BAR_FADE_CUTOFF) {
          StatusBar.setHidden(true, 'fade')
        }
      }
    },
    [drawerPercentOpen, bottomBarTranslationAnim, playBarOpacityAnim, isOpen]
  )

  const [isGestureEnabled, setIsGestureEnabled] = useState(true)

  // TODO: As we move away from the audio store slice in mobile-client
  // in favor of player/queue selectors in common, getNativeTrack calls
  // should be replaced
  const trackInfo = useSelector(getNativeTrack)
  const track = useSelectorWeb(state =>
    getTrack(state, trackInfo ? { id: trackInfo.trackId } : {})
  )
  const user = useSelectorWeb(state =>
    getUser(state, track ? { id: track.owner_id } : {})
  )

  const trackId = trackInfo?.trackId
  const [mediaKey, setMediaKey] = useState(0)
  useEffect(() => {
    setMediaKey(mediaKey => mediaKey + 1)
  }, [trackId])

  const onNext = useCallback(() => {
    setMediaKey(mediaKey => mediaKey + 1)
  }, [setMediaKey])

  const onPrevious = useCallback(() => {
    setMediaKey(mediaKey => mediaKey + 1)
  }, [setMediaKey])

  const onPressScrubberIn = useCallback(() => {
    setIsGestureEnabled(false)
  }, [setIsGestureEnabled])

  const onPressScrubberOut = useCallback(() => {
    setIsGestureEnabled(true)
  }, [setIsGestureEnabled])

  return (
    <Drawer
      // Appears below bottom bar whereas normally drawers appear above
      zIndex={3}
      isOpen={isOpen}
      onClose={handleDrawerCloseFromSwipe}
      onOpen={onDrawerOpen}
      initialOffsetPosition={PLAY_BAR_HEIGHT}
      isOpenToInitialOffset={!isOpen && isPlayBarShowing}
      animationStyle={DrawerAnimationStyle.SPRINGY}
      shouldBackgroundDim={false}
      shouldAnimateShadow={false}
      drawerStyle={{ top: -1 * insets.top, overflow: 'visible' }}
      onPercentOpen={onDrawerPercentOpen}
      onPanResponderMove={onPanResponderMove}
      isGestureSupported={isGestureEnabled}
    >
      <View style={styles.container}>
        {track && user && (
          <>
            <PlayBar
              track={track}
              user={user}
              onPress={onDrawerOpen}
              opacityAnim={playBarOpacityAnim}
            />
            <Logo opacityAnim={playBarOpacityAnim} />
            <View style={styles.titleBarContainer}>
              <TitleBar onClose={handleDrawerCloseFromSwipe} />
            </View>
            <View style={styles.artworkContainer}>
              <Artwork track={track} />
            </View>
            <View style={styles.trackInfoContainer}>
              <TrackInfo track={track} user={user} />
            </View>
            <View style={styles.scrubberContainer}>
              <Scrubber
                mediaKey={`${mediaKey}`}
                isPlaying={isPlaying}
                onPressIn={onPressScrubberIn}
                onPressOut={onPressScrubberOut}
                duration={track.duration}
              />
            </View>
            <View style={styles.controlsContainer}>
              <AudioControls onNext={onNext} onPrevious={onPrevious} />
              <ActionsBar track={track} />
            </View>
          </>
        )}
      </View>
    </Drawer>
  )
}

export default NowPlayingDrawer
