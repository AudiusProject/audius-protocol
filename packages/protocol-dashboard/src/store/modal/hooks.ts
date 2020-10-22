import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AppState } from 'store/types'
import { increment, decrement } from './slice'
// -------------------------------- Selectors --------------------------------
export const getCount = (state: AppState) => state.modal.count

// -------------------------------- Helpers --------------------------------
export const setOverflowHidden = () => {
  document.body.setAttribute('style', 'overflow:hidden;')
}

export const removeOverflowHidden = () => {
  document.body.setAttribute('style', '')
}

export const setModalRootTop = () => {
  const root = document.getElementById('modalRootContainer')
  if (root) {
    root.setAttribute('style', `top: ${window.scrollY}px`)
  }
}

// -------------------------------- Hooks --------------------------------
export const useModalCount = () => {
  const count = useSelector(getCount)
  const [isOverflowHidden, setIsOverflowHidden] = useState(false)
  useEffect(() => {
    if (!isOverflowHidden && count > 0) {
      setIsOverflowHidden(true)
      setOverflowHidden()
      setModalRootTop()
    } else if (isOverflowHidden && count === 0) {
      setIsOverflowHidden(false)
      removeOverflowHidden()
    }
  }, [count, isOverflowHidden])
}

export const useModalScrollCount = () => {
  const dispatch = useDispatch()
  const incrementScrollCount = useCallback(() => dispatch(increment()), [
    dispatch
  ])
  const decrementScrollCount = useCallback(() => dispatch(decrement()), [
    dispatch
  ])
  return {
    incrementScrollCount,
    decrementScrollCount
  }
}
