import MusicConfetti from 'components/background-animations/MusicConfetti'
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useIsMobile } from 'utils/clientUtil'
import { useSelector } from 'utils/reducer'
import { hide, getIsVisible } from './store/slice'
import { isMatrix } from 'utils/theme/theme'

const ConnectedMusicConfetti = () => {
  const dispatch = useDispatch()
  const onConfettiFinished = useCallback(() => {
    dispatch(hide())
  }, [dispatch])

  const isVisible = useSelector(getIsVisible)
  const isMatrixMode = isMatrix()
  const isMobile = useIsMobile()

  return isVisible ? (
    <MusicConfetti
      zIndex={10000}
      onCompletion={onConfettiFinished}
      isMatrix={isMatrixMode}
      limit={isMatrixMode ? (isMobile ? 200 : 500) : undefined}
      gravity={isMatrixMode ? 0.25 : undefined}
    />
  ) : (
    <></>
  )
}

export default ConnectedMusicConfetti
