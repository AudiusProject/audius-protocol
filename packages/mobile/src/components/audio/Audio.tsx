import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

import {
  accountSelectors,
  cacheUsersSelectors,
  hlsUtils,
  playerSelectors,
  playerActions,
  queueActions,
  queueSelectors,
  reachabilitySelectors,
  RepeatMode,
  FeatureFlags,
  encodeHashId,
  Genre
} from '@audius/common'
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  State,
  usePlaybackState,
  useTrackPlayerEvents,
  useProgress,
  TrackType
} from 'react-native-track-player'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import {
  DEFAULT_IMAGE_URL,
  useTrackImage
} from 'app/components/image/TrackImage'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useOfflineTrackUri } from 'app/hooks/useOfflineTrackUri'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'

import { useChromecast } from './GoogleCast'
import { logListen } from './listens'

const { getUser } = cacheUsersSelectors
const { getPlaying, getSeek, getCurrentTrack, getCounter } = playerSelectors
const { getRepeat } = queueSelectors
const { getIsReachable } = reachabilitySelectors

const { getUserId } = accountSelectors

type ProgressData = {
  currentTime: number
  duration?: number
}

// TODO: Probably don't use global for this
declare global {
  // eslint-disable-next-line no-var
  var progress: ProgressData
}

const SKIP_DURATION_SEC = 15
const RECORD_LISTEN_SECONDS = 1

const defaultCapabilities = [
  Capability.Play,
  Capability.Pause,
  Capability.SkipToNext,
  Capability.SkipToPrevious
]
const podcastCapabilities = [
  ...defaultCapabilities,
  Capability.JumpForward,
  Capability.JumpBackward
]

// Set options for controlling music on the lock screen when the app is in the background
const updatePlayerOptions = async (isPodcast = false) => {
  return await TrackPlayer.updateOptions({
    // Media controls capabilities
    capabilities: [
      ...(isPodcast ? podcastCapabilities : defaultCapabilities),
      Capability.Stop,
      Capability.SeekTo
    ],
    // Capabilities that will show up when the notification is in the compact form on Android
    compactCapabilities: [
      ...(isPodcast ? podcastCapabilities : defaultCapabilities)
    ],
    // Notification form capabilities
    notificationCapabilities: [
      ...(isPodcast ? podcastCapabilities : defaultCapabilities)
    ],
    android: {
      appKilledPlaybackBehavior:
        AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification
    }
  })
}

// Perform initial setup for the track player
const setupTrackPlayer = async () => {
  await TrackPlayer.setupPlayer()
  await updatePlayerOptions()
}

const playerEvents = [
  Event.PlaybackError,
  Event.PlaybackQueueEnded,
  Event.PlaybackProgressUpdated,
  Event.RemotePlay,
  Event.RemotePause,
  Event.RemoteNext,
  Event.RemotePrevious,
  Event.RemoteJumpForward,
  Event.RemoteJumpBackward,
  Event.RemoteSeek
]

export const Audio = () => {
  const { isEnabled: isStreamMp3Enabled } = useFeatureFlag(
    FeatureFlags.STREAM_MP3
  )
  const progress = useProgress(100) // 100ms update interval
  const playbackState = usePlaybackState()
  const track = useSelector(getCurrentTrack)
  const playing = useSelector(getPlaying)
  const seek = useSelector(getSeek)
  const counter = useSelector(getCounter)
  const repeatMode = useSelector(getRepeat)
  const trackOwner = useSelector((state) =>
    getUser(state, { id: track?.owner_id })
  )
  const trackImageSource = useTrackImage(track, trackOwner ?? undefined)
  const currentUserId = useSelector(getUserId)
  const isReachable = useSelector(getIsReachable)
  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  const { isCasting } = useChromecast()
  const dispatch = useDispatch()

  const [listenLoggedForTrack, setListenLoggedForTrack] = useState(false)

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

  useEffectOnce(() => {
    setupTrackPlayer()

    // Init progress tracking
    global.progress = {
      currentTime: 0
    }
  })

  // When component unmounts (App is closed), reset
  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  useTrackPlayerEvents(playerEvents, async (event) => {
    if (event.type === Event.PlaybackError) {
      console.error(`err ${event.code}:` + event.message)
    }

    if (event.type === Event.RemotePlay) play()
    if (event.type === Event.RemotePause) pause()
    if (event.type === Event.RemoteNext) next()
    if (event.type === Event.RemotePrevious) previous()

    if (event.type === Event.RemoteSeek) {
      setSeekPosition(event.position)
    }
    if (event.type === Event.RemoteJumpForward) {
      setSeekPosition(
        Math.min(progress.duration, progress.position + SKIP_DURATION_SEC)
      )
    }
    if (event.type === Event.RemoteJumpBackward) {
      setSeekPosition(Math.max(0, progress.position - SKIP_DURATION_SEC))
    }

    // TODO: Need to listen for different event when the queue is used for more than one track
    if (event.type === Event.PlaybackQueueEnded) {
      if (repeatMode !== RepeatMode.SINGLE) {
        TrackPlayer.reset()
      } else {
        global.progress.currentTime = 0
      }

      next()
    }
  })

  const onProgress = useCallback(
    (progress: ProgressData) => {
      if (!track || !currentUserId) return
      if (progressInvalidator.current) {
        progressInvalidator.current = false
        return
      }
      // Replicates logic in dapp.
      // TODO: REMOVE THIS ONCE BACKEND SUPPORTS THIS FEATURE
      if (
        progress.currentTime > RECORD_LISTEN_SECONDS &&
        (track.owner_id !== currentUserId || track.play_count < 10) &&
        !listenLoggedForTrack &&
        // TODO: log listens for offline plays when reconnected
        (!isOfflineModeEnabled || isReachable)
      ) {
        // Debounce logging a listen, update the state variable appropriately onSuccess and onFailure
        setListenLoggedForTrack(true)
        logListen(track.track_id, currentUserId, () =>
          setListenLoggedForTrack(false)
        )
      }

      if (!isCasting) {
        // If we aren't casting, update the progress
        global.progress = progress
      } else {
        // If we are casting, only update the duration
        // The currentTime is set via the effect in GoogleCast.tsx
        global.progress.duration = progress.duration
      }
    },
    [
      track,
      currentUserId,
      listenLoggedForTrack,
      isOfflineModeEnabled,
      isReachable,
      isCasting
    ]
  )

  useEffect(() => {
    onProgress({
      currentTime: progress.position,
      duration: progress.duration
    })
  }, [onProgress, progress])

  // A ref to invalidate the current progress counter and prevent
  // stale values of audio progress from propagating back to the UI.
  const progressInvalidator = useRef(false)

  const setSeekPosition = useCallback(
    (seek = 0) => {
      progressInvalidator.current = true
      TrackPlayer.seekTo(seek)

      // If we are casting, don't update the internal
      // seek clock. This is already handled by the effect in GoogleCast.tsx
      if (!isCasting) {
        global.progress.currentTime = seek
      }
    },
    [progressInvalidator, isCasting]
  )

  // Seek handler
  useEffect(() => {
    if (seek !== null) {
      setSeekPosition(seek)
    }
  }, [seek, setSeekPosition])

  // Restart (counter) handler
  useEffect(() => {
    setSeekPosition(0)
  }, [counter, setSeekPosition])

  useEffect(() => {
    setListenLoggedForTrack(false)
  }, [track, setListenLoggedForTrack])

  const { value: offlineTrackUri } = useOfflineTrackUri(
    track?.track_id.toString()
  )
  const streamingUri = useMemo(() => {
    return track && isReachable
      ? apiClient.makeUrl(`/tracks/${encodeHashId(track.track_id)}/stream`)
      : null
  }, [isReachable, track])

  const gateways = trackOwner
    ? audiusBackendInstance.getCreatorNodeIPFSGateways(
        trackOwner.creator_node_endpoint
      )
    : []

  const m3u8 = hlsUtils.generateM3U8Variants({
    segments: track?.track_segments ?? [],
    gateways
  })

  let source
  if (offlineTrackUri) {
    source = {
      type: TrackType.Default,
      uri: offlineTrackUri
    }
    // TODO: remove feature flag - https://github.com/AudiusProject/audius-client/pull/2147
  } else if (isStreamMp3Enabled && streamingUri) {
    source = {
      type: TrackType.Default,
      uri: streamingUri
    }
  } else if (m3u8) {
    source = {
      type: TrackType.HLS,
      uri: m3u8
    }
  }
  const currentUriRef = useRef<string | null>(null)
  const isPodcastRef = useRef<boolean>(false)

  const handleSourceChange = useCallback(
    async (newSource: { uri: string; type?: TrackType }) => {
      const newUri = newSource.uri
      if (currentUriRef.current !== newUri) {
        currentUriRef.current = newUri
        const imageUrl = trackImageSource?.source[2].uri ?? DEFAULT_IMAGE_URL
        await TrackPlayer.reset()
        await TrackPlayer.add({
          url: newUri,
          type: newSource.type ?? TrackType.Default,
          title: track?.title,
          artist: trackOwner?.name,
          genre: track?.genre,
          date: track?.created_at,
          artwork: imageUrl,
          duration: track?.duration
        })

        const isPodcast = track?.genre === Genre.PODCASTS
        if (isPodcast !== isPodcastRef.current) {
          isPodcastRef.current = isPodcast
          await updatePlayerOptions(isPodcast)
        }
        if (playing) await TrackPlayer.play()
      }
    },
    [playing, track, trackImageSource, trackOwner]
  )

  const handleTogglePlay = useCallback(
    async (isPlaying: boolean) => {
      if (playbackState === State.Playing && !isPlaying) {
        await TrackPlayer.pause()
      } else if (playbackState === State.Paused && isPlaying) {
        await TrackPlayer.play()
      }
    },
    [playbackState]
  )

  useEffect(() => {
    handleSourceChange(source)
  }, [handleSourceChange, source])

  useEffect(() => {
    handleTogglePlay(playing)
  }, [handleTogglePlay, playing])

  return null
}
