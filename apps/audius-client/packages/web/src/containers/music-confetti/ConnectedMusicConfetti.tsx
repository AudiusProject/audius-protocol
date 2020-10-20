import MusicConfetti from 'components/background-animations/MusicConfetti'
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useSelector } from 'utils/reducer'
import { getIsVisible } from './store/selectors'
import { hide } from './store/slice'

const ConnectedMusicConfetti = () => {
  const dispatch = useDispatch()
  const onConfettiFinished = useCallback(() => {
    dispatch(hide())
  }, [dispatch])

  const isVisible = useSelector(getIsVisible)

  return (
    isVisible && (
      <MusicConfetti zIndex={10000} onCompletion={onConfettiFinished} />
    )
  )
}

export default ConnectedMusicConfetti
