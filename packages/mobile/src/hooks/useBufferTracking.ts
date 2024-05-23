import { useCallback, useEffect, useState } from 'react'

import { time, timeEnd } from 'console'

import { useIsPlaying } from 'react-native-track-player'

export const useBufferTracking = () => {
  const [timeElapsed, setTimeElapsed] = useState<number>()
  const [startTime, setStartTime] = useState<number>()
  const { bufferingDuringPlay, playing: isTrackPlayerPlaying } = useIsPlaying()
  const startTimer = useCallback(() => {
    console.log('STARTED TIMER')
    time('Time till actual play')
    setStartTime(performance.now())
  }, [])
  useEffect(() => {
    if (isTrackPlayerPlaying && !bufferingDuringPlay) {
      if (startTime) {
        console.log('-- Tracking buffer time -- ')
        try {
          timeEnd('Time till actual play')
        } catch (e) {}
        setTimeElapsed(performance.now() - startTime)
        setStartTime(undefined)
      }
    }
  }, [bufferingDuringPlay, isTrackPlayerPlaying, startTime])
  return { startTimer, timeElapsed }
}
