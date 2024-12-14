import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import {
  useGetUserTracksByHandle,
  useGetUserById,
  Id,
  useGetCurrentUserId
} from '@audius/common/api'
import { OptionalId, type ID } from '@audius/common/models'
import { Formik } from 'formik'
import TrackPlayer, { RepeatMode, State } from 'react-native-track-player'
import { useAsync, useEffectOnce } from 'react-use'

import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { audiusSdk } from 'app/services/sdk/audius-sdk'

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

export const SelectArtistsPreviewContextProvider = (props: {
  children: JSX.Element
}) => {
  const [hasPlayed, setHasPlayed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [nowPlayingArtistId, setNowPlayingArtistId] = useState(-1)
  const [trackUrl, setTrackUrl] = useState<string | null>(null)
  const { data: currentUserId } = useGetCurrentUserId({})

  useEffectOnce(() => {
    TrackPlayer.setRepeatMode(RepeatMode.Track)
  })

  const { data: artist } = useGetUserById(
    {
      id: nowPlayingArtistId,
      currentUserId: null
    },
    { disabled: nowPlayingArtistId === -1 }
  )

  const { data: artistTracks } = useGetUserTracksByHandle(
    {
      handle: artist?.handle ?? '',
      currentUserId: null
    },
    { disabled: !artist?.handle }
  )
  useEffect(() => {
    if (!nowPlayingArtistId || !currentUserId || !artistTracks) return

    const fn = async () => {
      const sdk = await audiusSdk()
      const trackId = artistTracks?.find(
        (track) => track.is_available
      )?.track_id
      if (!trackId) return

      const { data, signature } =
        await audiusBackendInstance.signGatedContentRequest({
          sdk
        })

      const url = await sdk.tracks.getTrackStreamUrl({
        trackId: Id.parse(trackId),
        userId: OptionalId.parse(currentUserId),
        userSignature: signature,
        userData: data
      })

      setTrackUrl(url)
    }
    fn()
  }, [nowPlayingArtistId, currentUserId, artistTracks])

  // Request preview playback
  const playPreview = useCallback(async (artistId: ID) => {
    setHasPlayed(true)
    setNowPlayingArtistId(artistId)
    setIsPlaying(true)
    TrackPlayer.reset()
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
