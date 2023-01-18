import { useState, useRef, useEffect, useCallback } from 'react'

import type { Track } from '@audius/common'
import {
  accountSelectors,
  cacheUsersSelectors,
  cacheTracksSelectors,
  hlsUtils,
  playerSelectors,
  playerActions,
  queueActions,
  queueSelectors,
  reachabilitySelectors,
  RepeatMode,
  FeatureFlags,
  encodeHashId,
  Genre,
  tracksSocialActions
} from '@audius/common'
import { isEqual } from 'lodash'
import queue from 'react-native-job-queue'
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  State,
  usePlaybackState,
  useTrackPlayerEvents,
  useProgress,
  RepeatMode as TrackPlayerRepeatMode,
  TrackType
} from 'react-native-track-player'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { DEFAULT_IMAGE_URL } from 'app/components/image/TrackImage'
import { getImageSourceOptimistic } from 'app/hooks/useContentNodeImage'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { getLocalTrackImageSource } from 'app/hooks/useLocalImage'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import {
  getLocalAudioPath,
  isAudioAvailableOffline
} from 'app/services/offline-downloader'
import type { PlayCountWorkerPayload } from 'app/services/offline-downloader/workers/playCounterWorker'
import { PLAY_COUNTER_WORKER } from 'app/services/offline-downloader/workers/playCounterWorker'
import { getOfflineTracks } from 'app/store/offline-downloads/selectors'

import { useChromecast } from './GoogleCast'

const { getUsers } = cacheUsersSelectors
const { getTracks } = cacheTracksSelectors
const { getPlaying, getSeek, getCurrentTrack, getCounter } = playerSelectors
const { recordListen } = tracksSocialActions
const {
  getIndex,
  getOrder,
  getRepeat,
  getShuffle,
  getShuffleIndex,
  getShuffleOrder
} = queueSelectors
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

// TODO: These constants are the same in now playing drawer. Move them to shared location
const SKIP_DURATION_SEC = 15
const RESTART_THRESHOLD_SEC = 3
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

const playerEvents = [
  Event.PlaybackError,
  Event.PlaybackProgressUpdated,
  Event.PlaybackQueueEnded,
  Event.PlaybackTrackChanged,
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
  const currentUserId = useSelector(getUserId)

  const isReachable = useSelector(getIsReachable)
  const isNotReachable = isReachable === false
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const offlineTracks = useSelector(getOfflineTracks)

  // Queue Things
  const queueIndex = useSelector(getIndex)
  const queueOrder = useSelector(getOrder)
  const queueTrackUids = queueOrder.map((trackData) => trackData.uid)
  const queueTrackMap = useSelector((state) =>
    getTracks(state, { uids: queueTrackUids })
  )
  const queueTracks = queueOrder.map(
    (trackData) => queueTrackMap[trackData.id] as Track
  )
  const queueTrackOwnerIds = queueTracks.map((track) => track.owner_id)
  const queueTrackOwnersMap = useSelector((state) =>
    getUsers(state, { ids: queueTrackOwnerIds })
  )
  // Queue Shuffle Things
  const queueShuffle = useSelector(getShuffle)
  const queueShuffleIndex = useSelector(getShuffleIndex)
  const queueShuffleOrder = useSelector(getShuffleOrder)
  const queueShuffleTrackUids = queueShuffleOrder.map(
    (idx) => queueTrackUids[idx]
  )
  const queueShuffleTracks = queueShuffleOrder.map((idx) => queueTracks[idx])

  const { isCasting } = useChromecast()
  const dispatch = useDispatch()

  const isPodcastRef = useRef<boolean>(false)
  const [isAudioSetup, setIsAudioSetup] = useState(false)
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
  const updateQueueIndex = useCallback(
    (index: number) => dispatch(queueActions.updateIndex({ index })),
    [dispatch]
  )
  const updateQueueShuffleIndex = useCallback(
    (shuffleIndex: number) =>
      dispatch(queueActions.updateIndex({ shuffleIndex })),
    [dispatch]
  )
  const updatePlayerInfo = useCallback(
    ({ trackId, uid }: { trackId: number; uid: string }) => {
      dispatch(playerActions.set({ trackId, uid }))
    },
    [dispatch]
  )
  const incrementCount = useCallback(
    () => dispatch(playerActions.incrementCount()),
    [dispatch]
  )

  // Perform initial setup for the track player
  const setupTrackPlayer = async () => {
    if (isAudioSetup) return
    await TrackPlayer.setupPlayer()
    setIsAudioSetup(true)
    await updatePlayerOptions()
  }

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
    const duration = await TrackPlayer.getDuration()
    const position = await TrackPlayer.getPosition()

    if (event.type === Event.PlaybackError) {
      console.error(`err ${event.code}:` + event.message)
    }

    if (event.type === Event.RemotePlay || event.type === Event.RemotePause) {
      playing ? pause() : play()
    }
    if (event.type === Event.RemoteNext) next()
    if (event.type === Event.RemotePrevious) {
      if (position > RESTART_THRESHOLD_SEC) {
        setSeekPosition(0)
      } else {
        previous()
      }
    }

    if (event.type === Event.RemoteSeek) {
      setSeekPosition(event.position)
    }
    if (event.type === Event.RemoteJumpForward) {
      setSeekPosition(Math.min(duration, position + SKIP_DURATION_SEC))
    }
    if (event.type === Event.RemoteJumpBackward) {
      setSeekPosition(Math.max(0, position - SKIP_DURATION_SEC))
    }

    if (event.type === Event.PlaybackQueueEnded) {
      // TODO: Queue ended, what should done here?
    }

    if (event.type === Event.PlaybackTrackChanged) {
      const playerIndex = await TrackPlayer.getCurrentTrack()
      if (playerIndex === null) return

      // Manually increment player count if we are repeating
      if ((await TrackPlayer.getRepeatMode()) === TrackPlayerRepeatMode.Track) {
        incrementCount()
      }

      // Update queue and player state if the track player auto plays next track
      const trackIndex = queueShuffle ? queueShuffleIndex : queueIndex
      if (playerIndex !== trackIndex) {
        if (queueShuffle) {
          updateQueueShuffleIndex(playerIndex)
          const track = queueShuffleTracks[playerIndex]
          updatePlayerInfo({
            trackId: track.track_id,
            uid: queueShuffleTrackUids[playerIndex]
          })
        } else {
          updateQueueIndex(playerIndex)
          const track = queueTracks[playerIndex]
          updatePlayerInfo({
            trackId: track.track_id,
            uid: queueTrackUids[playerIndex]
          })
        }
      }

      const isPodcast = queueTracks[playerIndex]?.genre === Genre.PODCASTS
      if (isPodcast !== isPodcastRef.current) {
        isPodcastRef.current = isPodcast
        await updatePlayerOptions(isPodcast)
      }
    }
  })

  const onProgress = useCallback(async () => {
    const trackId = track?.track_id
    if (!trackId || !currentUserId) return
    if (progressInvalidator.current) {
      progressInvalidator.current = false
      return
    }

    const duration = await TrackPlayer.getDuration()
    const position = await TrackPlayer.getPosition()

    if (position > RECORD_LISTEN_SECONDS && !listenLoggedForTrack) {
      setListenLoggedForTrack(true)
      if (isReachable) {
        dispatch(recordListen(trackId))
      } else if (isOfflineModeEnabled) {
        queue.addJob<PlayCountWorkerPayload>(PLAY_COUNTER_WORKER, { trackId })
      }
    }

    if (!isCasting) {
      // If we aren't casting, update the progress
      global.progress = { duration, currentTime: position }
    } else {
      // If we are casting, only update the duration
      // The currentTime is set via the effect in GoogleCast.tsx
      global.progress.duration = duration
    }
  }, [
    track?.track_id,
    currentUserId,
    listenLoggedForTrack,
    isCasting,
    isReachable,
    isOfflineModeEnabled,
    dispatch
  ])

  useEffect(() => {
    onProgress()
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

  // Keep track of the track index the last time counter was updated
  const counterTrackIndex = useRef<number | null>(null)

  const resetPositionForSameTrack = useCallback(() => {
    // NOTE: Make sure that we only set seek position to 0 when we are restarting a track
    const trackIndex = queueShuffle ? queueShuffleIndex : queueIndex
    if (trackIndex === counterTrackIndex.current) setSeekPosition(0)
    counterTrackIndex.current = trackIndex
  }, [queueIndex, queueShuffle, queueShuffleIndex, setSeekPosition])

  const counterRef = useRef<number | null>(null)

  // Restart (counter) handler
  useEffect(() => {
    if (counter !== counterRef.current) {
      counterRef.current = counter
      resetPositionForSameTrack()
    }
    setListenLoggedForTrack(false)
  }, [counter, resetPositionForSameTrack])

  // Ref to keep track of the queue in the track player vs the queue in state
  const queueListRef = useRef<string[]>([])
  // Ref to ensure that we do not try to update while we are already updating
  const updatingQueueRef = useRef<boolean>(false)

  const handleQueueChange = useCallback(async () => {
    const refUids = queueListRef.current
    const trackUids = queueShuffle ? queueShuffleTrackUids : queueTrackUids
    const tracks = queueShuffle ? queueShuffleTracks : queueTracks
    const playIndex = queueShuffle ? queueShuffleIndex : queueIndex

    if (playIndex === -1 || isEqual(refUids, trackUids)) return

    updatingQueueRef.current = true
    queueListRef.current = trackUids

    // Check if this is a new queue or we are appending to the queue
    const isQueueAppend =
      refUids.length > 0 && isEqual(trackUids.slice(0, refUids.length), refUids)
    const newQueueTracks = isQueueAppend ? tracks.slice(refUids.length) : tracks

    const newTrackData = await Promise.all(
      newQueueTracks.map(async (track) => {
        const trackOwner = queueTrackOwnersMap[track.owner_id]
        const trackId = track.track_id.toString()
        const offlineTrackAvailable =
          trackId &&
          isOfflineModeEnabled &&
          offlineTracks[trackId] &&
          (await isAudioAvailableOffline(trackId))

        // Get Track url
        let url: string
        let isM3u8 = false
        if (offlineTrackAvailable) {
          const audioFilePath = getLocalAudioPath(trackId)
          url = `file://${audioFilePath}`
        } else if (isStreamMp3Enabled && isReachable) {
          url = apiClient.makeUrl(
            `/tracks/${encodeHashId(track.track_id)}/stream`
          )
        } else {
          isM3u8 = true
          const ownerGateways =
            audiusBackendInstance.getCreatorNodeIPFSGateways(
              trackOwner.creator_node_endpoint
            )
          url = hlsUtils.generateM3U8Variants({
            segments: track?.track_segments ?? [],
            gateways: ownerGateways
          })
        }

        const localSource = isNotReachable
          ? await getLocalTrackImageSource(trackId)
          : undefined

        const imageUrl =
          getImageSourceOptimistic({
            cid: track ? track.cover_art_sizes || track.cover_art : null,
            user: trackOwner,
            localSource
          })?.[2]?.uri ?? DEFAULT_IMAGE_URL

        return {
          url,
          type: isM3u8 ? TrackType.HLS : TrackType.Default,
          title: track?.title,
          artist: trackOwner?.name,
          genre: track?.genre,
          date: track?.created_at,
          artwork: imageUrl,
          duration: track?.duration
        }
      })
    )

    if (isQueueAppend) {
      await TrackPlayer.add(newTrackData)
    } else {
      // New queue, reset before adding new tracks
      // NOTE: Should only happen when the user selects a new lineup so reset should never be called in the background and cause an error
      await TrackPlayer.reset()
      await TrackPlayer.add(newTrackData)
      await TrackPlayer.skip(playIndex)
    }

    if (playing) await TrackPlayer.play()
    updatingQueueRef.current = false
  }, [
    isNotReachable,
    isOfflineModeEnabled,
    isReachable,
    isStreamMp3Enabled,
    offlineTracks,
    playing,
    queueIndex,
    queueShuffle,
    queueShuffleIndex,
    queueShuffleTrackUids,
    queueShuffleTracks,
    queueTrackOwnersMap,
    queueTrackUids,
    queueTracks
  ])

  const handleQueueIdxChange = useCallback(async () => {
    const playerIdx = await TrackPlayer.getCurrentTrack()
    const trackIdx = queueShuffle ? queueShuffleIndex : queueIndex

    if (
      !updatingQueueRef.current &&
      trackIdx !== -1 &&
      trackIdx !== playerIdx
    ) {
      await TrackPlayer.skip(trackIdx)
    }
  }, [queueIndex, queueShuffle, queueShuffleIndex])

  const handleTogglePlay = useCallback(async () => {
    if (playbackState === State.Playing && !playing) {
      await TrackPlayer.pause()
    } else if (
      (playbackState === State.Paused ||
        playbackState === State.Ready ||
        playbackState === State.Stopped) &&
      playing
    ) {
      await TrackPlayer.play()
    }
  }, [playbackState, playing])

  const handleRepeatModeChange = useCallback(async () => {
    if (repeatMode === RepeatMode.SINGLE) {
      await TrackPlayer.setRepeatMode(TrackPlayerRepeatMode.Track)
    } else if (repeatMode === RepeatMode.ALL) {
      await TrackPlayer.setRepeatMode(TrackPlayerRepeatMode.Queue)
    } else {
      await TrackPlayer.setRepeatMode(TrackPlayerRepeatMode.Off)
    }
  }, [repeatMode])

  useEffect(() => {
    handleRepeatModeChange()
  }, [handleRepeatModeChange, repeatMode])

  useEffect(() => {
    handleQueueChange()
  }, [handleQueueChange, queueTrackUids, queueShuffleTrackUids, queueShuffle])

  useEffect(() => {
    handleQueueIdxChange()
  }, [handleQueueIdxChange, queueIndex, queueShuffleIndex])

  useEffect(() => {
    handleTogglePlay()
  }, [handleTogglePlay, playing])

  return null
}
