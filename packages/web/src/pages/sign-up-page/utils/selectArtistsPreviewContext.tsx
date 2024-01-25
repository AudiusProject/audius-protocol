import { createContext, useCallback, useEffect, useState } from 'react'

import {
  ID,
  UserTrackMetadata,
  playerActions,
  useGetUserById,
  useGetUserTracksByHandle
} from '@audius/common'
import { useDispatch } from 'react-redux'
import { useUnmount } from 'react-use'

import { audioPlayer } from 'services/audio-player'

type PreviewContextProps = {
  isPlaying: boolean
  nowPlayingArtistId: number
  playPreview: (artistId: ID) => void
  stopPreview: () => void
  togglePreview: (artistId: ID) => void
}

export const SelectArtistsPreviewContext = createContext<PreviewContextProps>({
  isPlaying: false,
  nowPlayingArtistId: -1,
  playPreview: () => {},
  stopPreview: () => {},
  togglePreview: () => {}
})

export const SelectArtistsPreviewContextProvider = (props: {
  children: JSX.Element
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [nowPlayingArtistId, setNowPlayingArtistId] = useState<number>(-1)
  const [track, setTrack] = useState<UserTrackMetadata | null>(null)
  const dispatch = useDispatch()

  const { data: artist } = useGetUserById({
    id: nowPlayingArtistId,
    currentUserId: null
  })
  const { data: artistTracks } = useGetUserTracksByHandle(
    {
      handle: artist?.handle,
      currentUserId: null,
      // Unlikely we cant play an artist's first 3 tracks.
      limit: 3
    },
    { disabled: !artist?.handle }
  )

  useEffect(() => {
    const track = artistTracks?.find((track) => track.is_available)
    if (track) {
      setTrack(track)
    }
  }, [artistTracks])

  const togglePlayback = useCallback(() => {
    if (!audioPlayer) {
      return
    }
    if (audioPlayer.isPlaying()) {
      dispatch(playerActions.pause())
      setIsPlaying(false)
    } else {
      dispatch(playerActions.play())
      setIsPlaying(true)
    }
  }, [dispatch])

  const stopPreview = useCallback(() => {
    if (!audioPlayer) {
      return
    }
    audioPlayer.stop()
    setNowPlayingArtistId(-1)
    setTrack(null)
    setIsPlaying(false)
  }, [])

  const playPreview = useCallback(
    (artistId: ID) => {
      if (!audioPlayer) {
        return
      }
      if (audioPlayer.isPlaying()) {
        dispatch(playerActions.stop({}))
      }
      setNowPlayingArtistId(artistId)
      setIsPlaying(true)
    },
    [dispatch]
  )

  const togglePreview = useCallback(
    (artistId: ID) => {
      if (!audioPlayer) {
        return
      }
      if (artistId === nowPlayingArtistId) {
        togglePlayback()
      } else {
        dispatch(playerActions.stop({}))
        setIsPlaying(false)
        setNowPlayingArtistId(artistId)
      }
    },
    [nowPlayingArtistId, togglePlayback, dispatch]
  )

  useEffect(() => {
    if (!audioPlayer) {
      return
    }
    if (!track) return
    const { track_id, preview_cid, duration } = track
    const isPreview = !!preview_cid
    const startTime = isPreview
      ? undefined
      : Math.min(30, Math.max(0, duration - 30))

    dispatch(playerActions.play({ trackId: track_id, startTime, isPreview }))
    dispatch(
      playerActions.play({
        trackId: track_id,
        startTime,
        isPreview,
        onEnd: () => {
          stopPreview()
        }
      })
    )

    setIsPlaying(true)
  }, [nowPlayingArtistId, stopPreview, track, dispatch])

  useUnmount(stopPreview)

  return (
    <SelectArtistsPreviewContext.Provider
      value={{
        isPlaying,
        nowPlayingArtistId,
        playPreview,
        stopPreview,
        togglePreview
      }}
    >
      {props.children}
    </SelectArtistsPreviewContext.Provider>
  )
}
