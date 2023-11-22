import { createContext, useCallback, useEffect, useState } from 'react'

import {
  ID,
  encodeHashId,
  useGetUserById,
  useGetUserTracksByHandle
} from '@audius/common'

import { audioPlayer } from 'services/audio-player'
import { apiClient } from 'services/audius-api-client'

type PreviewContextProps = {
  playPreview: (artistId: ID) => void
  stopPreview: () => void
  togglePreview: (artistId: ID) => void
  playingPreviewArtistId: number
}

export const SelectArtistsPreviewContext = createContext<PreviewContextProps>({
  playPreview: () => {},
  stopPreview: () => {},
  togglePreview: () => {},
  playingPreviewArtistId: -1
})

export const SelectArtistsPreviewContextProvider = (props: {
  children: JSX.Element
}) => {
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

  useEffect(() => {
    if (!trackId) return
    audioPlayer.load(
      0,
      () => {},
      apiClient.makeUrl(`/tracks/${trackId}/stream`)
    )
    audioPlayer.play()

    // Clean up on unmount
    return audioPlayer.stop
  }, [nowPlayingArtistId, trackId])

  const togglePlayback = useCallback(() => {
    if (audioPlayer.isPlaying()) {
      audioPlayer.pause()
    } else {
      audioPlayer.play()
    }
  }, [])

  const stopPreview = useCallback(() => {
    audioPlayer.stop()
    setNowPlayingArtistId(-1)
  }, [])

  const playPreview = useCallback((artistId: ID) => {
    if (audioPlayer.isPlaying()) {
      audioPlayer.stop()
    }
    setNowPlayingArtistId(artistId)
  }, [])

  const togglePreview = useCallback(
    (artistId: ID) => {
      artistId === nowPlayingArtistId
        ? togglePlayback()
        : setNowPlayingArtistId(artistId)
    },
    [nowPlayingArtistId, togglePlayback]
  )

  return (
    <SelectArtistsPreviewContext.Provider
      value={{
        playPreview,
        stopPreview,
        togglePreview,
        playingPreviewArtistId: nowPlayingArtistId
      }}
    >
      {props.children}
    </SelectArtistsPreviewContext.Provider>
  )
}
