import React, {
  useState,
  useRef,
  useEffect,
  RefObject,
  useCallback
} from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { Platform, StyleSheet, View } from 'react-native'
import MusicControl from 'react-native-music-control'
import Video, { OnProgressData } from 'react-native-video'
import { Command } from 'react-native-music-control/lib/types'

import { AppState } from '../../store'
import * as audioActions from '../../store/audio/actions'
import { getGoogleCastStatus } from '../../store/googleCast/selectors'
import { CastStatus, setPlayPosition } from '../../store/googleCast/actions'
import {
  getTrack,
  getPlaying,
  getSeek,
  getIndex,
  getQueueLength,
  getRepeatMode,
  getIsShuffleOn,
  getShuffleIndex
} from '../../store/audio/selectors'

import { MessageType } from '../../message'
import { logListen } from './listens'
import { postMessage } from '../../utils/postMessage'
import { MessagePostingWebView } from '../../types/MessagePostingWebView'
import { RepeatMode } from '../../store/audio/reducer'

declare global {
  interface Global {
    progress: {
      currentTime: number
    }
  }
}

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
  track,
  index,
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
  googleCastStatus,
  setCastPlayPosition
}: Props) => {
  const videoRef = useRef<Video>(null)
  // Keep track of whether we have ever started playback.
  // Only then is it safe to set OS music control stuff.
  const hasPlayedOnce = useRef<boolean>(false)
  const isPlaying = useRef<boolean>(false)
  const hasEnabledControls = useRef<boolean>(false)

  // const [updateOnProgress, setUpdateOnProgress] = useState(false)

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
    // @ts-ignore
    global.progress = {
      currentTime: 0,
      seekableTime: 0
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
      index: index,
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
    MusicControl.on(Command.play, () => {
      if (webRef.current) {
        postMessage(webRef.current, {
          type: MessageType.SYNC_PLAYER,
          isPlaying: true,
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
          isAction: true
        })
      }
      pause()
    })
  }, [webRef, next, previous, play, pause])

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
          isAction: true
        })
      }
    } else if (track && track.isDelete) {
      if (webRef.current) {
        // Sync w/ isPlaying false to set player state in dapp and hide drawer
        postMessage(webRef.current, {
          type: MessageType.SYNC_PLAYER,
          isPlaying: false,
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
      MusicControl.enableControl('previousTrack', isPreviousEnabled)
      MusicControl.enableControl('nextTrack', isNextEnabled)
    }
  }, [
    playing,
    hasPlayedOnce,
    index,
    queueLength,
    repeatMode,
    isShuffleOn,
    shuffleIndex
  ])

  // Seek handler
  useEffect(() => {
    if (seek !== null && videoRef.current) {
      progressInvalidator.current = true
      videoRef.current.seek(seek)
      elapsedTime.current = seek
      global.progress.currentTime = seek

      MusicControl.updatePlayback({
        elapsedTime: elapsedTime.current
      })
    }
  }, [seek, webRef, progressInvalidator, elapsedTime])

  useEffect(() => {
    setListenLoggedForTrack(false)
  }, [track, setListenLoggedForTrack])

  const [isCastConnecting, setIsCastConnecting] = useState(false)

  useEffect(() => {
    if (!isCastConnecting && googleCastStatus === CastStatus.Connecting) {
      setIsCastConnecting(true)
      if (playing) pause()
      setCastPlayPosition(elapsedTime.current)
    } else if (googleCastStatus !== CastStatus.Connecting) {
      setIsCastConnecting(false)
    }
  }, [
    googleCastStatus,
    elapsedTime,
    playing,
    pause,
    setCastPlayPosition,
    setIsCastConnecting,
    isCastConnecting
  ])

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
      // @ts-ignore
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
          muted={googleCastStatus === CastStatus.Connected}
          onError={handleError}
          onEnd={() => {
            setDuration(0)
            setCastPlayPosition(0)
            pause()
            next()
          }}
          progressUpdateInterval={100}
          onLoad={payload => {
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
  track: getTrack(state),
  index: getIndex(state),
  queueLength: getQueueLength(state),
  playing: getPlaying(state),
  seek: getSeek(state),
  repeatMode: getRepeatMode(state),
  googleCastStatus: getGoogleCastStatus(state),
  isShuffleOn: getIsShuffleOn(state),
  shuffleIndex: getShuffleIndex(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  play: () => dispatch(audioActions.play()),
  pause: () => dispatch(audioActions.pause()),
  next: () => dispatch(audioActions.next()),
  previous: () => dispatch(audioActions.previous()),
  reset: () => dispatch(audioActions.reset()),
  setCastPlayPosition: (position: number) => dispatch(setPlayPosition(position))
})

export default connect(mapStateToProps, mapDispatchToProps)(Audio)
