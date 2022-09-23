import { useState, useRef, useEffect, useCallback } from 'react'

import {
  accountSelectors,
  cacheUsersSelectors,
  hlsUtils,
  Genre,
  playerSelectors,
  playerActions,
  queueActions,
  queueSelectors,
  RepeatMode
} from '@audius/common'
import { Platform, StyleSheet, View } from 'react-native'
import MusicControl from 'react-native-music-control'
import { Command } from 'react-native-music-control/lib/types'
import type { OnProgressData } from 'react-native-video'
import Video from 'react-native-video'
import { useDispatch, useSelector } from 'react-redux'

import { audiusBackendInstance } from 'app/services/audius-backend-instance'

import { useChromecast } from './GoogleCast'
import { logListen } from './listens'

const { getUser } = cacheUsersSelectors
const { getPlaying, getSeek, getCurrentTrack } = playerSelectors
const { getIndex, getLength, getRepeat, getShuffle, getShuffleIndex } =
  queueSelectors

const { getUserId } = accountSelectors

declare global {
  // eslint-disable-next-line no-var
  var progress: {
    currentTime: number
    playableDuration?: number
    seekableDuration?: number
  }
}

const SKIP_DURATION_SEC = 15

const DEFAULT_IMAGE_URL =
  'https://download.audius.co/static-resources/preview-image.jpg'

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

export const Audio = () => {
  const track = useSelector(getCurrentTrack)
  const index = useSelector(getIndex)
  const queueLength = useSelector(getLength)
  const playing = useSelector(getPlaying)
  const seek = useSelector(getSeek)
  const repeatMode = useSelector(getRepeat)
  const isShuffleOn = useSelector(getShuffle)
  const shuffleIndex = useSelector(getShuffleIndex)
  const trackOwner = useSelector(
    (state) => getUser(state, { id: track?.owner_id }),
    // Equality function to prevent audio restart when visiting profile screen
    (left, right) => left?.user_id === right?.user_id
  )
  const currentUserId = useSelector(getUserId)

  const dispatch = useDispatch()

  const play = useCallback(() => dispatch(playerActions.play()), [dispatch])
  const pause = useCallback(() => dispatch(playerActions.pause()), [dispatch])
  const next = useCallback(() => dispatch(queueActions.next()), [dispatch])
  const previous = useCallback(
    () => dispatch(queueActions.previous()),
    [dispatch]
  )
  const reset = useCallback(
    () => dispatch(playerActions.reset({ shouldAutoplay: false })),
    [dispatch]
  )

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
      play()
    })
    MusicControl.on(Command.pause, () => {
      pause()
    })
  }, [videoRef, seek, next, previous, play, pause])

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
    if (track && !track.is_delete && duration !== null) {
      const imageUrl =
        track._cover_art_sizes?.['1000x1000'] ?? DEFAULT_IMAGE_URL
      // Set the background mode when a song starts
      // playing to ensure audio outside app
      // continues when music isn't being played.
      MusicControl.enableBackgroundMode(true)
      MusicControl.setNowPlaying({
        title: track.title,
        artwork: imageUrl,
        artist: trackOwner?.name,
        duration
      })
    } else if (track && track.is_delete) {
      MusicControl.resetNowPlaying()
    } else {
      if (Platform.OS === 'ios') {
        MusicControl.handleAudioInterruptions(false)
      }
    }
  }, [track, index, duration, trackOwner])

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
  }, [seek, progressInvalidator, elapsedTime, isCasting])

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

  const onNext = useCallback(() => {
    const isSingleRepeating = repeatMode === RepeatMode.SINGLE
    if (isSingleRepeating) {
      global.progress.currentTime = 0
    }

    next()
  }, [next, repeatMode])

  const onProgress = useCallback(
    (progress: OnProgressData) => {
      if (!track || !currentUserId) return
      if (progressInvalidator.current) {
        progressInvalidator.current = false
        return
      }
      elapsedTime.current = progress.currentTime
      // Replicates logic in dapp.
      // TODO: REMOVE THIS ONCE BACKEND SUPPORTS THIS FEATURE
      if (
        progress.currentTime > RECORD_LISTEN_SECONDS &&
        (track.owner_id !== currentUserId || track.play_count < 10) &&
        !listenLoggedForTrack
      ) {
        // Debounce logging a listen, update the state variable appropriately onSuccess and onFailure
        setListenLoggedForTrack(true)
        logListen(track.track_id, currentUserId, () =>
          setListenLoggedForTrack(false)
        )
      }
      global.progress = progress
    },
    [
      track,
      currentUserId,
      listenLoggedForTrack,
      setListenLoggedForTrack,
      progressInvalidator
    ]
  )

  if (!track || track.is_delete) return null

  const gateways = trackOwner
    ? audiusBackendInstance.getCreatorNodeIPFSGateways(
        trackOwner.creator_node_endpoint
      )
    : []

  const m3u8 = hlsUtils.generateM3U8Variants({
    segments: track.track_segments,
    gateways
  })

  return (
    <View style={styles.backgroundVideo}>
      {m3u8 && (
        <Video
          source={{
            uri: m3u8,
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
