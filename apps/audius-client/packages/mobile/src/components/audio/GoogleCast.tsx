import { useCallback, useEffect } from 'react'

import { castActions, playerSelectors } from '@audius/common'
import {
  CastState,
  useCastState,
  useRemoteMediaClient,
  useStreamPosition
} from 'react-native-google-cast'
import { useSelector } from 'react-redux'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
const { setIsCasting } = castActions
const { getCurrentTrack, getPlaying, getSeek } = playerSelectors

export const useChromecast = () => {
  const dispatchWeb = useDispatchWeb()

  // Data hooks
  const track = useSelector(getCurrentTrack)
  const playing = useSelector(getPlaying)
  const seek = useSelector(getSeek)

  // Cast hooks
  const client = useRemoteMediaClient()
  const castState = useCastState()
  const streamPosition = useStreamPosition(0.5)

  const loadCast = useCallback(
    (track, startTime) => {
      if (client && track) {
        client.loadMedia({
          mediaInfo: {
            contentUrl: track.uri,
            contentType: 'application/vnd.apple.mpegurl',
            metadata: {
              type: 'musicTrack',
              images: [
                {
                  url: track.largeArtwork
                }
              ],
              title: track.title,
              artist: track.artist
            }
          },
          startTime
        })
      }
    },
    [client]
  )

  const playCast = useCallback(() => {
    client?.play()
  }, [client])

  const pauseCast = useCallback(() => {
    client?.pause()
  }, [client])

  // Update our cast UI when the cast device connects
  useEffect(() => {
    switch (castState) {
      case CastState.CONNECTED:
        dispatchWeb(setIsCasting({ isCasting: true }))
        break
      default:
        dispatchWeb(setIsCasting({ isCasting: false }))
        break
    }
  }, [castState, dispatchWeb])

  // Load media when the cast connects
  useEffect(() => {
    if (castState === CastState.CONNECTED) {
      loadCast(track, global.progress.currentTime ?? 0)
    }
  }, [loadCast, track, castState])

  // Play & pause the cast device
  useEffect(() => {
    if (castState === CastState.CONNECTED) {
      if (playing) {
        playCast()
      } else {
        pauseCast()
      }
    }
  }, [playing, playCast, pauseCast, castState])

  // Update the audius seek with the stream position from
  // the cast device
  useEffect(() => {
    if (streamPosition !== null) {
      global.progress.currentTime = streamPosition
    }
  }, [streamPosition])

  // Seek the cast device
  useEffect(() => {
    if (seek !== null) {
      client?.seek({ position: seek })
    }
  }, [client, seek])

  return {
    isCasting: castState === CastState.CONNECTED
  }
}
