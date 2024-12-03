import { createContext, useCallback, useMemo, useState } from 'react'

// import {
//   playerActions,
//   playerSelectors,
//   queueActions,
//   queueSelectors
// } from '@audius/common/store'
// import Sound from 'react-native-sound'
// import TrackPlayer from 'react-native-track-player'
// import { useSelector } from 'react-redux'

// Sound.setCategory('Playback')

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
  // const dispatch = useDispatch()
  const [isPlaying, setIsPlaying] = useState(false)
  // const uid = useSelector(playerSelectors.getUid)
  // const queueOrder = useSelector(queueSelectors.getOrder)
  // const queueLength = useSelector(queueSelectors.getLength)
  // console.log({ uid, queueLength, queueOrder })

  // const soundRef = useRef<Sound | null>(null)

  // Request preview playback
  const playPreview = useCallback(async (url: string) => {
    console.log('PLAY PREVIEW', { url })
    setIsPlaying(true)

    // --- 1 ---
    // const sound = new Sound(url, Sound.MAIN_BUNDLE, (error) => {
    // const sound = new Sound(url, '', (error) => {
    //   if (error) {
    //     console.log('failed to load the sound', error)
    //     return
    //   }
    //   // when loaded successfully
    //   console.log(
    //     'duration in seconds: ' +
    //       sound.getDuration() +
    //       'number of channels: ' +
    //       sound.getNumberOfChannels()
    //   )
    // })
    // sound.setVolume(1)
    // soundRef.current = sound
    // soundRef.current.play()

    // --- 2 ---
    // if (queueLength) {
    //   dispatch(playerActions.stop({}))
    //   dispatch(queueActions.clear({}))
    // }
    // await TrackPlayer.load({ url })
    // await TrackPlayer.play()
  }, [])

  const stopPreview = useCallback(async () => {
    console.log('STOP PREVIEW')
    setIsPlaying(false)

    // --- 1 ---
    // soundRef.current?.stop()
    // dispatch(queueActions.clear({}))

    // --- 2 ---
    // dispatch(playerActions.stop({}))
    // dispatch(queueActions.clear({}))
    // await TrackPlayer.stop()
    // await TrackPlayer.reset()
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
