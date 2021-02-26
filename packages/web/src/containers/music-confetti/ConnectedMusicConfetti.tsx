import MusicConfetti from 'components/background-animations/MusicConfetti'
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useIsMobile } from 'utils/clientUtil'
import { useSelector } from 'utils/reducer'
import { getIsMatrix, hide, getIsVisible } from './store/slice'

const ConnectedMusicConfetti = () => {
  const dispatch = useDispatch()
  const onConfettiFinished = useCallback(() => {
    dispatch(hide())
  }, [dispatch])

  const isVisible = useSelector(getIsVisible)
  const isMatrix = useSelector(getIsMatrix)
  const isMobile = useIsMobile()

  return (
    isVisible && (
      <MusicConfetti
        zIndex={10000}
        onCompletion={onConfettiFinished}
        isMatrix={isMatrix}
        limit={isMatrix ? (isMobile ? 200 : 500) : undefined}
        gravity={isMatrix ? 0.25 : undefined}
      />
    )
  )
}

export default ConnectedMusicConfetti
