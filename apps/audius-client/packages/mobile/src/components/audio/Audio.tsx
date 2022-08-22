import type { RefObject } from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'

import { Genre } from '@audius/common'
import { Platform, StyleSheet, View } from 'react-native'
import MusicControl from 'react-native-music-control'
import { Command } from 'react-native-music-control/lib/types'
import type { OnProgressData } from 'react-native-video'
import Video from 'react-native-video'
import { connect } from 'react-redux'
import type { Dispatch } from 'redux'

import { MessageType } from 'app/message'
import type { AppState } from 'app/store'
import * as audioActions from 'app/store/audio/actions'
import { RepeatMode } from 'app/store/audio/reducer'
import {
  getPlaying,
  getSeek,
  getQueueLength,
  getRepeatMode,
  getIsShuffleOn,
  getShuffleIndex,
  getQueueAutoplay,
  getTrackAndIndex
} from 'app/store/audio/selectors'
import type { MessagePostingWebView } from 'app/types/MessagePostingWebView'
import { postMessage } from 'app/utils/postMessage'

import { useChromecast } from './GoogleCast'
import { logListen } from './listens'

declare global {
  // eslint-disable-next-line no-var
  var progress: {
    currentTime: number
    playableDuration?: number
    seekableDuration?: number
  }
}

const SKIP_DURATION_SEC = 15

const RECORD_LISTEN_SECONDS = 1

const styles = StyleSheet.create({
  backgroundVideo: {
    position: 'absolute',
    display: 'none',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  }
})

type OwnProps = {
  webRef: RefObject<MessagePostingWebView>
}

type Props = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const Audio = ({
  webRef,
  trackAndIndex: { track, index },
  queueLength,
  playing,
  seek,
  play,
  pause,
  next,
  previous,
  reset,
  repeatMode,
  isShuffleOn,
  shuffleIndex,
  queueAutoplay
}: Props) => {
  const videoRef = useRef<Video>(null)
  // Keep track of whether we have ever started playback.
  // Only then is it safe to set OS music control stuff.
  const hasPlayedOnce = useRef<boolean>(false)
  const isPlaying = useRef<boolean>(false)
  const hasEnabledControls = useRef<boolean>(false)

  const elapsedTime = useRef(0)
  // It is important for duration to be null when it isn't set
  // to the correct value or else MusicControl gets confused.
  const [duration, setDuration] = useState<number | null>(null)

  const [listenLoggedForTrack, setListenLoggedForTrack] = useState(false)

  // A ref to invalidate the current progress counter and prevent
  // stale values of audio progress from propagating back to the UI.
  const progressInvalidator = useRef(false)

  // Init progress tracking
  useEffect(() => {
    // TODO: Probably don't use global for this
    global.progress = {
      currentTime: 0
    }
  }, [])

  // When component unmounts (App is closed), stop music controls and reset
  useEffect(() => {
    return () => {
      MusicControl.stopControl()
      reset()
    }
  }, [reset])

  useEffect(() => {
    if (!webRef.current) return
    postMessage(webRef.current, {
      type: MessageType.SYNC_QUEUE,
      info: track,
      index,
      isAction: true
    })
  }, [webRef, track, index])

  useEffect(() => {
    isPlaying.current = playing
    if (playing && !hasPlayedOnce.current) {
      hasPlayedOnce.current = true
    }
    if (hasPlayedOnce.current && !hasEnabledControls.current) {
      hasEnabledControls.current = true
      MusicControl.enableControl('play', true)
      MusicControl.enableControl('pause', true)
      if (Platform.OS === 'android') {
        MusicControl.enableControl('closeNotification', true, {
          when: 'paused'
        })
      }
    }
  }, [playing, hasPlayedOnce, isPlaying, hasEnabledControls])

  // Init MusicControl
  useEffect(() => {
    if (Platform.OS === 'ios') {
      MusicControl.handleAudioInterruptions(true)
    }

    MusicControl.on(Command.nextTrack, () => {
      next()
    })
    MusicControl.on(Command.previousTrack, () => {
      previous()
    })
    MusicControl.on(Command.skipForward, () => {
      if (videoRef.current) {
        elapsedTime.current = elapsedTime.current + SKIP_DURATION_SEC
        videoRef.current.seek(elapsedTime.current)
        global.progress.currentTime = elapsedTime.current
        MusicControl.updatePlayback({
          elapsedTime: elapsedTime.current
        })
      }
    })
    MusicControl.on(Command.skipBackward, () => {
      if (videoRef.current) {
        elapsedTime.current = elapsedTime.current - SKIP_DURATION_SEC
        videoRef.current.seek(elapsedTime.current)
        global.progress.currentTime = elapsedTime.current
        MusicControl.updatePlayback({
          elapsedTime: elapsedTime.current
        })
      }
    })
    MusicControl.on(Command.play, () => {
      if (webRef.current) {
        postMessage(webRef.current, {
          type: MessageType.SYNC_PLAYER,
          isPlaying: true,
          incrementCounter: false,
          isAction: true
        })
      }
      play()
    })
    MusicControl.on(Command.pause, () => {
      if (webRef.current) {
        postMessage(webRef.current, {
          type: MessageType.SYNC_PLAYER,
          isPlaying: false,
          incrementCounter: false,
          isAction: true
        })
      }
      pause()
    })
  }, [webRef, videoRef, seek, next, previous, play, pause])

  // Playing handler
  useEffect(() => {
    if (hasPlayedOnce.current) {
      MusicControl.updatePlayback({
        state: playing ? MusicControl.STATE_PLAYING : MusicControl.STATE_PAUSED,
        elapsedTime: elapsedTime.current
      })
    }
  }, [hasPlayedOnce, playing, elapsedTime])

  // Track Info handler
  useEffect(() => {
    if (track && !track.isDelete && duration !== null) {
      // Set the background mode when a song starts
      // playing to ensure audio outside app
      // continues when music isn't being played.
      MusicControl.enableBackgroundMode(true)
      MusicControl.setNowPlaying({
        title: track.title,
        artwork: Platform.OS === 'ios' ? track.artwork : track.largeArtwork,
        artist: track.artist,
        duration
      })
      if (webRef.current) {
        // Sync w/ isPlaying true in case it was previously false from a deleted track.
        postMessage(webRef.current, {
          type: MessageType.SYNC_PLAYER,
          isPlaying: true,
          incrementCounter: false,
          isAction: true
        })
      }
    } else if (track && track.isDelete) {
      if (webRef.current) {
        // Sync w/ isPlaying false to set player state in dapp and hide drawer
        postMessage(webRef.current, {
          type: MessageType.SYNC_PLAYER,
          isPlaying: false,
          incrementCounter: false,
          isAction: true
        })
      }
      MusicControl.resetNowPlaying()
    } else {
      if (Platform.OS === 'ios') {
        MusicControl.handleAudioInterruptions(false)
      }
    }
  }, [webRef, track, index, duration])

  // Next and Previous handler
  useEffect(() => {
    if (playing || hasPlayedOnce.current) {
      let isPreviousEnabled
      let isNextEnabled
      if (repeatMode === RepeatMode.ALL) {
        isPreviousEnabled = true
        isNextEnabled = true
      } else if (isShuffleOn) {
        isPreviousEnabled = shuffleIndex > 0
        isNextEnabled = shuffleIndex < queueLength - 1
      } else {
        isPreviousEnabled = index > 0
        isNextEnabled = index < queueLength - 1
      }
      if (track && track.genre === Genre.PODCASTS) {
        MusicControl.enableControl('previousTrack', false)
        MusicControl.enableControl('nextTrack', false)
        MusicControl.enableControl('skipBackward', true, { interval: 15 })
        MusicControl.enableControl('skipForward', true, { interval: 15 })
      } else {
        MusicControl.enableControl('skipBackward', false, { interval: 15 })
        MusicControl.enableControl('skipForward', false, { interval: 15 })
        MusicControl.enableControl('previousTrack', isPreviousEnabled)
        MusicControl.enableControl('nextTrack', isNextEnabled)
      }
    }
  }, [
    playing,
    hasPlayedOnce,
    index,
    track,
    queueLength,
    repeatMode,
    isShuffleOn,
    shuffleIndex
  ])

  const { isCasting } = useChromecast()

  // Seek handler
  useEffect(() => {
    if (seek !== null && videoRef.current) {
      progressInvalidator.current = true
      videoRef.current.seek(seek)
      elapsedTime.current = seek

      // If we are casting, don't update the internal
      // seek clock
      if (!isCasting) {
        global.progress.currentTime = seek
      }

      MusicControl.updatePlayback({
        elapsedTime: elapsedTime.current
      })
    }
  }, [seek, webRef, progressInvalidator, elapsedTime, isCasting])

  useEffect(() => {
    setListenLoggedForTrack(false)
  }, [track, setListenLoggedForTrack])

  const handleError = (e: any) => {
    console.error('err ' + JSON.stringify(e))
  }

  useEffect(() => {
    if (Platform.OS === 'android') {
      const updateInterval = setInterval(() => {
        if (isPlaying.current) {
          MusicControl.updatePlayback({
            elapsedTime: elapsedTime.current // (Seconds)
          })
        }
      }, 500)
      return () => clearInterval(updateInterval)
    }
  }, [elapsedTime, isPlaying])

  // handle triggering of autoplay when current track ends
  // (this is the flow when the next button is NOT clicked by the user)
  // (if the next button is clicked by the user, the dapp client will handle autoplay logic)
  const onNext = useCallback(() => {
    // if autoplay is enabled and current song is close to end of queue,
    // then trigger queueing of recommended tracks for autoplay
    const isCloseToEndOfQueue = index + 2 >= queueLength
    const isNotRepeating = repeatMode === RepeatMode.OFF
    if (
      webRef.current &&
      queueAutoplay &&
      !isShuffleOn &&
      isNotRepeating &&
      isCloseToEndOfQueue
    ) {
      postMessage(webRef.current, {
        type: MessageType.REQUEST_QUEUE_AUTOPLAY,
        genre: (track && track.genre) || undefined,
        trackId: (track && track.trackId) || undefined,
        isAction: true
      })
    }

    const isSingleRepeating = repeatMode === RepeatMode.SINGLE
    if (webRef.current && isSingleRepeating) {
      global.progress.currentTime = 0
      // Sync w/ incrementCounter true to update mediaKey in client NowPlaying
      // which will eventually restart the scrubber location
      postMessage(webRef.current, {
        type: MessageType.SYNC_PLAYER,
        isPlaying: true,
        incrementCounter: true,
        isAction: true
      })
    }

    next()
  }, [
    next,
    webRef,
    queueAutoplay,
    index,
    queueLength,
    isShuffleOn,
    repeatMode,
    track
  ])

  const onProgress = useCallback(
    (progress: OnProgressData) => {
      if (!track) return
      if (progressInvalidator.current) {
        progressInvalidator.current = false
        return
      }
      elapsedTime.current = progress.currentTime

      // Replicates logic in dapp.
      // TODO: REMOVE THIS ONCE BACKEND SUPPORTS THIS FEATURE
      if (
        progress.currentTime > RECORD_LISTEN_SECONDS &&
        (track.ownerId !== track.currentUserId ||
          track.currentListenCount < 10) &&
        !listenLoggedForTrack
      ) {
        // Debounce logging a listen, update the state variable appropriately onSuccess and onFailure
        setListenLoggedForTrack(true)
        logListen(track.trackId, track.currentUserId, () =>
          setListenLoggedForTrack(false)
        )
      }
      global.progress = progress
    },
    [track, listenLoggedForTrack, setListenLoggedForTrack, progressInvalidator]
  )

  return (
    <View style={styles.backgroundVideo}>
      {track && !track.isDelete && track.uri && (
        <Video
          source={{
            uri: track.uri,
            // @ts-ignore: this is actually a valid prop override
            type: 'm3u8'
          }}
          ref={videoRef}
          playInBackground
          playWhenInactive
          allowsExternalPlayback={false}
          audioOnly
          // Mute playback if we are casting to an external source
          muted={isCasting}
          onError={handleError}
          onEnd={() => {
            setDuration(0)
            pause()
            onNext()
          }}
          progressUpdateInterval={100}
          onLoad={(payload) => {
            setDuration(payload.duration)
          }}
          onProgress={onProgress}
          repeat={repeatMode === RepeatMode.SINGLE}
          paused={!playing}
          // onBuffer={this.onBuffer}
        />
      )}
    </View>
  )
}

const mapStateToProps = (state: AppState) => ({
  trackAndIndex: getTrackAndIndex(state),
  queueLength: getQueueLength(state),
  playing: getPlaying(state),
  seek: getSeek(state),
  repeatMode: getRepeatMode(state),
  isShuffleOn: getIsShuffleOn(state),
  shuffleIndex: getShuffleIndex(state),
  queueAutoplay: getQueueAutoplay(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  play: () => dispatch(audioActions.play()),
  pause: () => dispatch(audioActions.pause()),
  next: () => dispatch(audioActions.next()),
  previous: () => dispatch(audioActions.previous()),
  reset: () => dispatch(audioActions.reset())
})

export default connect(mapStateToProps, mapDispatchToProps)(Audio)
