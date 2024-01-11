import { createContext, useCallback, useEffect, useState } from 'react'

import {
  ID,
  encodeHashId,
  useGetUserById,
  useGetUserTracksByHandle
} from '@audius/common'
import { useUnmount } from 'react-use'

import { audioPlayer } from 'services/audio-player'
import { apiClient } from 'services/audius-api-client'

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
  const [trackId, setTrackId] = useState<string | null>(null)

  const { data: artist } = useGetUserById({
    id: nowPlayingArtistId,
    currentUserId: null
  })
  const { data: artistTracks } = useGetUserTracksByHandle(
    {
      handle: artist?.handle,
      currentUserId: null
    },
    { disabled: !artist?.handle }
  )

  useEffect(() => {
    const trackId = artistTracks?.find((track) => track.is_available)?.track_id
    trackId && setTrackId(encodeHashId(trackId))
  }, [artistTracks])

  const togglePlayback = useCallback(() => {
    if (!audioPlayer) {
      return
    }
    if (audioPlayer.isPlaying()) {
      audioPlayer.pause()
      setIsPlaying(false)
    } else {
      audioPlayer.play()
      setIsPlaying(true)
    }
  }, [])

  const stopPreview = useCallback(() => {
    if (!audioPlayer) {
      return
    }
    audioPlayer.stop()
    setNowPlayingArtistId(-1)
    setTrackId(null)
    setIsPlaying(false)
  }, [])

  const playPreview = useCallback((artistId: ID) => {
    if (!audioPlayer) {
      return
    }
    if (audioPlayer.isPlaying()) {
      audioPlayer.stop()
    }
    setNowPlayingArtistId(artistId)
    setIsPlaying(true)
  }, [])

  const togglePreview = useCallback(
    (artistId: ID) => {
      if (!audioPlayer) {
        return
      }
      if (artistId === nowPlayingArtistId) {
        togglePlayback()
      } else {
        audioPlayer.stop()
        setIsPlaying(false)
        setNowPlayingArtistId(artistId)
      }
    },
    [nowPlayingArtistId, togglePlayback]
  )

  useEffect(() => {
    if (!trackId) return
    if (!audioPlayer) {
      return
    }
    audioPlayer.load(
      0,
      stopPreview,
      apiClient.makeUrl(`/tracks/${trackId}/stream`)
    )
    audioPlayer.play()
    setIsPlaying(true)
  }, [nowPlayingArtistId, stopPreview, trackId])

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
