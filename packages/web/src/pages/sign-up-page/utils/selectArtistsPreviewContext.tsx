import { createContext, useCallback, useEffect, useState } from 'react'

import { ID } from '@audius/common'

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

  // TODO: fetch actual track ID
  const trackId = 'Kdb0BgY'

  useEffect(() => {
    audioPlayer.load(
      0,
      () => {},
      apiClient.makeUrl(`/v1/tracks/${trackId}/stream`)
    )
    audioPlayer.play()

    // Clean up on unmount
    return audioPlayer.stop
  }, [trackId])

  const togglePlayback = audioPlayer.isPlaying()
    ? audioPlayer.pause
    : audioPlayer.play

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
