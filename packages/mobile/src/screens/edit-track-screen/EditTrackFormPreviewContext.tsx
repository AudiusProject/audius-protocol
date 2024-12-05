import { createContext, useCallback, useMemo, useState } from 'react'

import { playerActions, playerSelectors } from '@audius/common/store'
import SoundPlayer from 'react-native-sound-player'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

type PreviewContextProps = {
  isPlaying: boolean
  playPreview: (url: string) => void
  stopPreview: () => void
}

export const EditTrackFormPreviewContext = createContext<PreviewContextProps>({
  isPlaying: false,
  playPreview: () => {},
  stopPreview: () => {}
})

export const EditTrackFormPreviewContextProvider = (props: {
  children: JSX.Element
}) => {
  const dispatch = useDispatch()
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayerPlaying = useSelector(playerSelectors.getPlaying)

  useEffectOnce(() => {
    SoundPlayer.addEventListener('FinishedPlaying', () => {
      setIsPlaying(false)
    })
  })

  // Request preview playback
  const playPreview = useCallback(
    async (url: string) => {
      if (isPlayerPlaying) dispatch(playerActions.pause())

      setIsPlaying(true)
      SoundPlayer.playUrl(url)
    },
    [dispatch, isPlayerPlaying]
  )

  // Stop preview playback
  const stopPreview = useCallback(async () => {
    setIsPlaying(false)
    SoundPlayer.stop()
  }, [])

  const context = useMemo(
    () => ({
      isPlaying,
      playPreview,
      stopPreview
    }),
    [isPlaying, playPreview, stopPreview]
  )

  return (
    <EditTrackFormPreviewContext.Provider value={context}>
      {props.children}
    </EditTrackFormPreviewContext.Provider>
  )
}
