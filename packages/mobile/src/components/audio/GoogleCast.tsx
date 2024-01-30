import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  castActions,
  playerSelectors,
  cacheUsersSelectors
} from '@audius/common'
import { SquareSizes } from '@audius/common/models'
import { encodeHashId } from '@audius/common/utils'
import {
  CastState,
  useCastState,
  useRemoteMediaClient
} from 'react-native-google-cast'
import TrackPlayer from 'react-native-track-player'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync, usePrevious } from 'react-use'

import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'

const { setIsCasting } = castActions
const { getCurrentTrack, getPlaying, getSeek, getCounter } = playerSelectors

const { getUser } = cacheUsersSelectors

export const useChromecast = () => {
  const dispatch = useDispatch()

  // Data hooks
  const counter = useSelector(getCounter)
  const track = useSelector(getCurrentTrack)
  const prevTrack = usePrevious(track)
  const playing = useSelector(getPlaying)
  const seek = useSelector(getSeek)

  const owner = useSelector((state) =>
    getUser(state, {
      id: track?.owner_id
    })
  )

  // Cast hooks
  const client = useRemoteMediaClient()
  const castState = useCastState()

  const [internalCounter, setInternalCounter] = useState(0)
  const streamingUri = useMemo(() => {
    return track
      ? apiClient.makeUrl(`/tracks/${encodeHashId(track.track_id)}/stream`)
      : null
  }, [track])

  const loadCast = useCallback(
    async (track, startTime) => {
      if (client && track && owner && streamingUri) {
        const imageUrl = await audiusBackendInstance.getImageUrl(
          track.cover_art_sizes,
          SquareSizes.SIZE_1000_BY_1000,
          track.cover_art_cids
        )

        client.loadMedia({
          mediaInfo: {
            contentUrl: streamingUri,
            metadata: {
              type: 'musicTrack',
              images: [
                {
                  url: imageUrl
                }
              ],
              title: track.title,
              artist: owner.name
            }
          },
          startTime
        })
      }
    },
    [client, streamingUri, owner]
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
        dispatch(setIsCasting({ isCasting: true }))
        break
      default:
        dispatch(setIsCasting({ isCasting: false }))
        break
    }
  }, [castState, dispatch])

  // Ensure that the progress gets reset to 0
  // when a new track is played
  useEffect(() => {
    if (prevTrack && prevTrack !== track && counter !== internalCounter) {
      setInternalCounter(0)
    }
  }, [prevTrack, track, counter, internalCounter, setInternalCounter])

  // Load media when the cast connects
  useAsync(async () => {
    if (castState === CastState.CONNECTED) {
      const currentPosition = await TrackPlayer.getPosition()
      loadCast(track, currentPosition)
    }
  }, [loadCast, track, prevTrack, castState])

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
