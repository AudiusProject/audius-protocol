import { useCallback } from 'react'

import { modalsSelectors, modalsActions, Modals } from '@audius/common'
import { useDispatch } from 'react-redux'

import { useSelector } from './useSelector'

const { setVisibility } = modalsActions
const { getModalVisibility } = modalsSelectors
/**
 * Sets visibility for a modal
 * *Returns a higher order function*
 *
 * Usage:
 * ```
 * const setVisibility = useSetVisibility()
 * const setModalA = setVisibility('ModalA')
 * const setModalB = setVisibility('ModalB')
 * ---- later ----
 * setModalA(true)
 * setModalB(false)
 * ```
 *
 */
export const useSetVisibility = () => {
  const dispatch = useDispatch()
  const setVisibilityFunc = useCallback(
    (modalName: Modals) => (isOpen: boolean) => {
      dispatch(setVisibility({ modal: modalName, visible: isOpen }))
    },
    [dispatch]
  )
  return setVisibilityFunc
}

/**
 * Gets the latest visibility for a modal
 */
export const useGetVisibility = (modalName: Modals) => {
  return useSelector((state) => getModalVisibility(state, modalName))
}

/**
 * Convenience wrapper to return getter and setter for modals,
 * in the familiar form of useState.
 *
 * If you need more *power*, use the individual setter and getter
 * hooks above.
 */
export const useModalState = (
  _modalName: Modals
): [boolean, (isOpen: boolean) => void] => {
  return [false, () => {}]
}
