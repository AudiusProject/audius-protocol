import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import type { ID } from '@audius/common'
import { encodeHashId } from '@audius/common'
import { useGetUserTracksByHandle, useGetUserById } from '@audius/common/api'
import { Formik } from 'formik'
import TrackPlayer, { RepeatMode, State } from 'react-native-track-player'
import { useAsync, useEffectOnce } from 'react-use'

import { apiClient } from 'app/services/audius-api-client'

type PreviewContextProps = {
  hasPlayed: boolean
  isPlaying: boolean
  nowPlayingArtistId: number
  playPreview: (artistId: ID) => void
  togglePreview: () => void
}

export const SelectArtistsPreviewContext = createContext<PreviewContextProps>({
  hasPlayed: true,
  isPlaying: false,
  nowPlayingArtistId: -1,
  playPreview: () => {},
  togglePreview: () => {}
})

const useGetTrackUrl = (artistId: ID) => {
  const { data: artist } = useGetUserById(
    {
      id: artistId,
      currentUserId: null
    },
    { disabled: artistId === -1 }
  )

  const { data: artistTracks } = useGetUserTracksByHandle(
    {
      handle: artist?.handle,
      currentUserId: null
    },
    { disabled: !artist?.handle }
  )

  const trackId = artistTracks?.find((track) => track.is_available)?.track_id
  if (!trackId) return null

  return apiClient.makeUrl(`/tracks/${encodeHashId(trackId)}/stream`)
}

export const SelectArtistsPreviewContextProvider = (props: {
  children: JSX.Element
}) => {
  const [hasPlayed, setHasPlayed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [nowPlayingArtistId, setNowPlayingArtistId] = useState(-1)

  useEffectOnce(() => {
    TrackPlayer.setRepeatMode(RepeatMode.Track)
  })

  const trackUrl = useGetTrackUrl(nowPlayingArtistId)

  // Request preview playback
  const playPreview = useCallback(async (artistId: ID) => {
    await TrackPlayer.reset()
    setHasPlayed(true)
    setNowPlayingArtistId(artistId)
    setIsPlaying(true)
  }, [])

  // Initiates preview playback once trackUrl is available
  useAsync(async () => {
    if (!trackUrl) return
    setIsPlaying(true)
    await TrackPlayer.add({ url: trackUrl })
    await TrackPlayer.play()
  }, [nowPlayingArtistId, trackUrl])

  const togglePreview = useCallback(async () => {
    const { state } = await TrackPlayer.getPlaybackState()
    if (state !== State.Paused) {
      setIsPlaying(false)
      await TrackPlayer.pause()
    } else if (state === State.Paused) {
      setIsPlaying(true)
      await TrackPlayer.play()
    }
  }, [])

  const context = useMemo(
    () => ({
      hasPlayed,
      isPlaying,
      nowPlayingArtistId,
      playPreview,
      togglePreview
    }),
    [hasPlayed, isPlaying, nowPlayingArtistId, playPreview, togglePreview]
  )

  useEffect(() => {
    TrackPlayer.reset()
  }, [])

  return (
    <SelectArtistsPreviewContext.Provider value={context}>
      {/* fake formik context to ensure useFormikContext works */}
      <Formik initialValues={{}} onSubmit={() => {}}>
        {props.children}
      </Formik>
    </SelectArtistsPreviewContext.Provider>
  )
}
