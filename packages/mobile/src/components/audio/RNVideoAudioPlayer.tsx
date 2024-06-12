import { useRef, useEffect, useCallback, useState, useMemo } from 'react'

import { useAppContext } from '@audius/common/context'
import { Name, SquareSizes } from '@audius/common/models'
import type { Track } from '@audius/common/models'
import {
  cacheTracksSelectors,
  cacheUsersSelectors,
  savedPageTracksLineupActions,
  queueActions,
  queueSelectors,
  reachabilitySelectors,
  tracksSocialActions,
  playerActions,
  playerSelectors,
  gatedContentSelectors,
  calculatePlayerBehavior,
  PlayerBehavior,
  accountSelectors
} from '@audius/common/store'
import type { Queueable } from '@audius/common/store'
import {
  encodeHashId,
  shallowCompare,
  removeNullable,
  getQueryParams,
  getTrackPreviewDuration
} from '@audius/common/utils'
import type { Nullable } from '@audius/common/utils'
import { isEqual } from 'lodash'
import { TrackType } from 'react-native-track-player'
import Video from 'react-native-video'
import { useDispatch, useSelector } from 'react-redux'
import { usePrevious } from 'react-use'
import { useFeatureFlag } from '~/hooks'
import { FeatureFlags } from '~/services'

import { DEFAULT_IMAGE_URL } from 'app/components/image/TrackImage'
import { getImageSourceOptimistic } from 'app/hooks/useContentNodeImage'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { make, track as analyticsTrack } from 'app/services/analytics'
import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import {
  getLocalAudioPath,
  getLocalTrackCoverArtPath
} from 'app/services/offline-downloader'
import { DOWNLOAD_REASON_FAVORITES } from 'app/store/offline-downloads/constants'
import {
  getOfflineTrackStatus,
  getIsCollectionMarkedForDownload
} from 'app/store/offline-downloads/selectors'
import {
  addOfflineEntries,
  OfflineDownloadStatus
} from 'app/store/offline-downloads/slice'

const { getUsers } = cacheUsersSelectors
const { getTracks, getTrackStreamUrls } = cacheTracksSelectors
const { getPlaying, getSeek, getCurrentTrack, getCounter } = playerSelectors
const { recordListen } = tracksSocialActions
const { getPlayerBehavior } = queueSelectors
const { getIndex, getOrder, getSource, getCollectionId } = queueSelectors
const { getIsReachable } = reachabilitySelectors
const { getUserId } = accountSelectors

const { getNftAccessSignatureMap } = gatedContentSelectors

// const bufferTimes: number[] = []

const unlistedTrackFallbackTrackData = {
  url: 'url',
  type: TrackType.Default,
  title: '',
  artist: '',
  genre: '',
  artwork: '',
  imageUrl: '',
  duration: 0
}

type QueueableTrack = {
  track: Nullable<Track>
} & Pick<Queueable, 'playerBehavior'>

// TODO: native mobile controls not implemented
// TODO: These constants are the same in now playing drawer. Move them to shared location
// const SKIP_DURATION_SEC = 15
// const RESTART_THRESHOLD_SEC = 3
const RECORD_LISTEN_SECONDS = 1

// const TRACK_END_BUFFER = 2

export const RNVideoAudioPlayer = () => {
  const dispatch = useDispatch()
  // Internal state keeping track of current url (could be a preview url or a full track url)
  // const [currentTrackURL, setCurrentTrackURL] = useState<string>()

  // Redux store data
  const track = useSelector(getCurrentTrack)
  // const previousTrackId = usePrevious(track?.track_id)
  const isPlaying = useSelector(getPlaying)
  const seek = useSelector(getSeek)
  const counter = useSelector(getCounter)
  // const repeatMode = useSelector(getRepeat)
  // const playbackRate = useSelector(getPlaybackRate)
  const currentUserId = useSelector(getUserId)
  // const uid = useSelector(getUid)
  // Player behavior determines whether to preview a track or play the full track
  const playerBehavior =
    useSelector(getPlayerBehavior) || PlayerBehavior.FULL_OR_PREVIEW
  // const previousUid = usePrevious(uid)
  const previousPlayerBehavior = usePrevious(playerBehavior)
  // TODO: logic for preview/play swapping not implemented
  const didPlayerBehaviorChange = previousPlayerBehavior !== playerBehavior
  // const trackPositions = useSelector((state: CommonState) =>
  //   getUserTrackPositions(state, { userId: currentUserId })
  // )
  const nftAccessSignatureMap = useSelector(getNftAccessSignatureMap)

  const trackStreamUrls = useSelector(getTrackStreamUrls)

  // Queue things
  const [isQueueLoaded, setIsQueueLoaded] = useState(false)
  const queueIndex = useSelector(getIndex)
  // const queueShuffle = useSelector(getShuffle)
  const queueOrder = useSelector(getOrder)
  const queueSource = useSelector(getSource)
  const queueCollectionId = useSelector(getCollectionId)
  const queueTrackUids = queueOrder.map((trackData) => trackData.uid)
  const queueTrackIds = queueOrder.map((trackData) => trackData.id)
  const queueTrackMap = useSelector(
    (state) => getTracks(state, { uids: queueTrackUids }),
    shallowCompare
  )
  const [bufferStartTime, setBufferStartTime] = useState<number>()
  const { isEnabled: isPerformanceExperimentEnabled } = useFeatureFlag(
    FeatureFlags.SKIP_STREAM_CHECK
  )
  const queueTracks: QueueableTrack[] = queueOrder.map(
    ({ id, playerBehavior }) => ({
      track: queueTrackMap[id] as Nullable<Track>,
      playerBehavior
    })
  )
  const queueTrackOwnerIds = queueTracks
    .map(({ track }) => track?.owner_id)
    .filter(removeNullable)
  const queueTrackOwnersMap = useSelector(
    (state) => getUsers(state, { ids: queueTrackOwnerIds }),
    shallowCompare
  )

  // Offline Things
  // TODO: offline mode partially implemented but not tested
  const isReachable = useSelector(getIsReachable)
  const isCollectionMarkedForDownload = useSelector(
    getIsCollectionMarkedForDownload(
      queueSource === savedPageTracksLineupActions.prefix
        ? DOWNLOAD_REASON_FAVORITES
        : queueCollectionId?.toString()
    )
  )
  const wasCollectionMarkedForDownload = usePrevious(
    isCollectionMarkedForDownload
  )
  const didOfflineToggleChange =
    isCollectionMarkedForDownload !== wasCollectionMarkedForDownload

  const isNotReachable = isReachable === false
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const { storageNodeSelector } = useAppContext()
  // A map from trackId to offline availability
  const offlineAvailabilityByTrackId = useSelector((state) => {
    const offlineTrackStatus = getOfflineTrackStatus(state)
    return queueTrackIds.reduce((result, id) => {
      if (offlineTrackStatus[id] === OfflineDownloadStatus.SUCCESS) {
        return {
          ...result,
          [id]: true
        }
      }
      return result
    }, {})
  }, isEqual)

  // Video player ref (controls audio output)
  const videoRef = useRef<Video>(null)
  // The ref of trackQueryParams to avoid re-generating query params for the same track
  const trackQueryParams = useRef({})
  // Ref to keep track of the queue in the track player vs the queue in state
  const queueUIDsRef = useRef<string[]>([])
  // Ref to keep track of the playable queue urls\
  const queueRef = useRef<any[]>([]) // TODO: replace any
  // Performance tracker for measuring track load time
  const [trackLoadStartTime, setTrackLoadStartTime] = useState<number>()

  // A ref to the enqueue task to await before either requeing or appending to queue
  const enqueueTracksJobRef = useRef<Promise<void>>()
  // A way to abort the enqeue tracks job if a new lineup is played
  const abortEnqueueControllerRef = useRef(new AbortController())

  // TODO: these will be used by native controls but these are currently not implemented
  // Callbacks to dispatch redux changes
  // const play = useCallback(() => dispatch(playerActions.play()), [dispatch])
  // const pause = useCallback(() => dispatch(playerActions.pause()), [dispatch])
  const next = useCallback(() => dispatch(queueActions.next()), [dispatch])
  // const previous = useCallback(
  //   () => dispatch(queueActions.previous()),
  //   [dispatch]
  // )
  const reset = useCallback(
    () => dispatch(playerActions.reset({ shouldAutoplay: false })),
    [dispatch]
  )
  const updateQueueIndex = useCallback(
    (index: number) => dispatch(queueActions.updateIndex({ index })),
    [dispatch]
  )
  const updatePlayerInfo = useCallback(
    ({
      previewing,
      trackId,
      uid
    }: {
      previewing: boolean
      trackId: number
      uid: string
    }) => {
      dispatch(playerActions.set({ previewing, trackId, uid }))
    },
    [dispatch]
  )

  const makeTrackData = useCallback(
    async ({ track, playerBehavior }: QueueableTrack) => {
      if (!track) {
        return unlistedTrackFallbackTrackData
      }

      const trackOwner = queueTrackOwnersMap[track.owner_id]
      const trackId = track.track_id
      const offlineTrackAvailable =
        trackId && isOfflineModeEnabled && offlineAvailabilityByTrackId[trackId]

      const { shouldPreview } = calculatePlayerBehavior(track, playerBehavior)

      // Get Track url
      let url: string
      // Performance POC: use a pre-fetched DN url if we have it
      const trackStreamUrl = trackStreamUrls[trackId]
      if (offlineTrackAvailable && isCollectionMarkedForDownload) {
        const audioFilePath = getLocalAudioPath(trackId)
        url = `file://${audioFilePath}`
      } else if (trackStreamUrl && isPerformanceExperimentEnabled) {
        url = trackStreamUrl
      } else {
        let queryParams = trackQueryParams.current[trackId]

        if (!queryParams) {
          const nftAccessSignature = nftAccessSignatureMap[trackId]?.mp3 ?? null
          queryParams = await getQueryParams({
            audiusBackendInstance,
            nftAccessSignature,
            userId: currentUserId || undefined
          })
          trackQueryParams.current[trackId] = queryParams
        }

        queryParams = { ...queryParams, preview: shouldPreview }

        url = apiClient.makeUrl(
          `/tracks/${encodeHashId(track.track_id)}/stream`,
          queryParams
        )
      }

      const localTrackImageSource =
        isNotReachable && track
          ? { uri: `file://${getLocalTrackCoverArtPath(trackId.toString())}` }
          : undefined

      const cid = track ? track.cover_art_sizes || track.cover_art : null

      const imageUrl =
        cid && storageNodeSelector
          ? getImageSourceOptimistic({
              cid,
              endpoints: storageNodeSelector.getNodes(cid),
              size: SquareSizes.SIZE_1000_BY_1000,
              localSource: localTrackImageSource
            })?.uri ?? DEFAULT_IMAGE_URL
          : DEFAULT_IMAGE_URL

      return {
        url,
        type: TrackType.Default,
        title: track.title,
        artist: trackOwner.name,
        genre: track.genre,
        date: track.created_at,
        artwork: imageUrl,
        duration: shouldPreview
          ? getTrackPreviewDuration(track)
          : track.duration
      }
    },
    [
      currentUserId,
      isCollectionMarkedForDownload,
      isNotReachable,
      isOfflineModeEnabled,
      isPerformanceExperimentEnabled,
      nftAccessSignatureMap,
      offlineAvailabilityByTrackId,
      queueTrackOwnersMap,
      storageNodeSelector,
      trackStreamUrls
    ]
  )

  const handleError = (e: any) => {
    console.error('---- Error occurred', e)
    // TODO: would report any errors here
    dispatch(playerActions.setBuffering({ buffering: false }))
  }

  // When component unmounts (App is closed), reset player state
  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  // Record plays (for play count stats)
  useEffect(() => {
    const trackId = track?.track_id
    if (!trackId) return

    const playCounterTimeout = setTimeout(() => {
      if (isReachable) {
        dispatch(recordListen(trackId))
      } else if (isOfflineModeEnabled) {
        dispatch(
          addOfflineEntries({ items: [{ type: 'play-count', id: trackId }] })
        )
      }
    }, RECORD_LISTEN_SECONDS)

    return () => clearTimeout(playCounterTimeout)
  }, [counter, dispatch, isOfflineModeEnabled, isReachable, track?.track_id])

  // TODO: with RN video this could be probably be handled in saga land and not here
  const handleQueueChange = useCallback(async () => {
    const refUids = queueUIDsRef.current
    if (queueIndex === -1) {
      return
    }
    if (
      isEqual(refUids, queueTrackUids) &&
      !didOfflineToggleChange &&
      !didPlayerBehaviorChange
    ) {
      return
    }

    queueUIDsRef.current = queueTrackUids

    // Checks to allow for continuous playback while making queue updates
    // Check if we are appending to the end of the queue
    const isQueueAppend =
      refUids.length > 0 &&
      isEqual(queueTrackUids.slice(0, refUids.length), refUids) &&
      !didPlayerBehaviorChange

    // If not an append, cancel the enqueue task first
    if (!isQueueAppend) {
      abortEnqueueControllerRef.current.abort()
    }
    // wait for enqueue task to either shut down or finish
    if (enqueueTracksJobRef.current) {
      await enqueueTracksJobRef.current
    }

    // Re-init the abort controller now that the enqueue job is done
    abortEnqueueControllerRef.current = new AbortController()

    // TODO: Queue removal logic was firing too often previously and causing playback issues when at the end of queues. Need to fix
    // Check if we are removing from the end of the queue
    // const isQueueRemoval =
    //   refUids.length > 0 &&
    //   isEqual(refUids.slice(0, queueTrackUids.length), queueTrackUids)

    // if (isQueueRemoval) {
    //   // NOTE: There might be a case where we are trying to remove the currently playing track.
    //   // Shouldn't be possible, but need to keep an eye out for that
    //   const startingRemovalIndex = queueTrackUids.length
    //   const removalLength = refUids.length - queueTrackUids.length
    //   const removalIndexArray = range(removalLength).map(
    //     (i) => i + startingRemovalIndex
    //   )
    //   await TrackPlayer.remove(removalIndexArray)
    //   await TrackPlayer.skip(queueIndex)
    //   return
    // }

    const newQueueTracks = isQueueAppend
      ? queueTracks.slice(refUids.length)
      : queueTracks

    // Enqueue tracks using 'middle-out' to ensure user can ready skip forward or backwards
    const enqueueTracks = async (
      queuableTracks: QueueableTrack[],
      queueIndex = -1
    ) => {
      let currentPivot = 1
      while (
        queueIndex - currentPivot >= 0 ||
        queueIndex + currentPivot < queueTracks.length
      ) {
        if (abortEnqueueControllerRef.current.signal.aborted) {
          return
        }

        const nextIndex = queueIndex + currentPivot
        const nextTrack = queuableTracks[nextIndex]
        if (nextTrack) {
          const nextTrackData = await makeTrackData(nextTrack)
          queueRef.current[nextIndex] = nextTrackData
        }

        const prevIndex = queueIndex - currentPivot
        const previousTrack = queuableTracks[prevIndex]
        if (previousTrack) {
          const prevTrackData = await makeTrackData(previousTrack)
          queueRef.current[prevIndex] = prevTrackData
        }
        currentPivot++
      }
    }

    if (isQueueAppend) {
      enqueueTracksJobRef.current = enqueueTracks(newQueueTracks)
      await enqueueTracksJobRef.current
      enqueueTracksJobRef.current = undefined
    } else {
      setIsQueueLoaded(false)
      queueRef.current = []
      const firstTrack = newQueueTracks[queueIndex]
      if (!firstTrack) return

      queueRef.current[queueIndex] = await makeTrackData(firstTrack)
      setIsQueueLoaded(true)
      enqueueTracksJobRef.current = enqueueTracks(newQueueTracks, queueIndex)
      await enqueueTracksJobRef.current
      enqueueTracksJobRef.current = undefined
    }
  }, [
    queueIndex,
    queueTrackUids,
    didOfflineToggleChange,
    didPlayerBehaviorChange,
    queueTracks,
    makeTrackData
  ])

  useEffect(() => {
    handleQueueChange()
  }, [handleQueueChange, queueTrackUids])

  const setSeekPosition = useCallback((seek = 0) => {
    if (videoRef.current) {
      videoRef.current.seek(seek)
    }
  }, [])

  useEffect(() => {
    if (seek !== null) {
      setSeekPosition(seek)
    }
  }, [seek, setSeekPosition])

  const onNext = useCallback(() => {
    // TODO: single repeating not implemented
    // const isSingleRepeating = repeatMode === RepeatMode.SINGLE
    const nextTrack = queueTracks[queueIndex + 1]
    if (nextTrack && nextTrack.track) {
      next()
      updateQueueIndex(queueIndex + 1)
      updatePlayerInfo({
        previewing: nextTrack.playerBehavior === PlayerBehavior.PREVIEW_OR_FULL,
        trackId: nextTrack.track.track_id,
        uid: queueTrackUids[queueIndex + 1]
      })
    }
  }, [
    next,
    queueIndex,
    queueTrackUids,
    queueTracks,
    updatePlayerInfo,
    updateQueueIndex
  ])

  const onLoadStart = () => {
    setTrackLoadStartTime(performance.now())
    // dispatch(playerActions.setBuffering({ buffering: true }))
  }

  const onLoadFinish = () => {
    setTrackLoadStartTime(performance.now())
    if (trackLoadStartTime && bufferStartTime) {
      const ttp = Math.ceil(performance.now() - bufferStartTime)
      // bufferTimes.push(ttp)
      // const currentAvg =
      //   bufferTimes.reduce((a, b) => a + b, 0) / bufferTimes.length

      // const bufferDuration = Math.ceil(performance.now() - trackLoadStartTime)

      // console.log(
      //   `-- Time till play: ${ttp}ms. Current avg: ${currentAvg}ms. Sample Size: ${bufferTimes.length}`
      // )
      // console.log(
      //   `-- Buffer duration: ${bufferDuration}ms - diff=${ttp - bufferDuration}`
      // )
      analyticsTrack(make({ eventName: Name.BUFFERING_TIME, duration: ttp }))
    }
    dispatch(playerActions.setBuffering({ buffering: false }))
  }

  const trackURI = useMemo(() => {
    return queueRef.current[queueIndex]?.url
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueIndex, isQueueLoaded]) // need to recompute track if the queue isn't loaded

  useEffect(() => {
    if (trackURI) {
      setBufferStartTime(performance.now())
      dispatch(playerActions.setBuffering({ buffering: true }))
    }
  }, [dispatch, trackURI])

  return trackURI ? (
    <Video
      source={{ uri: trackURI }}
      ref={videoRef}
      playInBackground
      playWhenInactive
      allowsExternalPlayback={false}
      audioOnly
      progressUpdateInterval={10000}
      // TODO: casting features not implemented
      // Mute playback if we are casting to an external source
      // muted={isCasting}
      onError={handleError}
      onEnd={() => {
        onNext()
      }}
      ignoreSilentSwitch='ignore'
      onLoadStart={onLoadStart}
      onLoad={onLoadFinish}
      // TODO: repeating mode not implemented
      // repeat={repeatMode === RepeatMode.SINGLE}
      paused={!isPlaying}
      automaticallyWaitsToMinimizeStalling={false}
      bufferConfig={{
        minBufferMs: 1000,
        maxBufferMs: 50000,
        bufferForPlaybackMs: 1000,
        bufferForPlaybackAfterRebufferMs: 2000
      }}
    />
  ) : null
}
