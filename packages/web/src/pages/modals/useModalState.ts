import { useCallback } from 'react'

import { modalsSelectors, modalsActions, Modals } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'
const { setVisibility } = modalsActions
const { getModalVisibility } = modalsSelectors

export const useModalState = (modalName: Modals) => {
  const modalState = useSelector((state) =>
    getModalVisibility(state, modalName)
  )
  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    dispatch(setVisibility({ modal: modalName, visible: 'closing' }))
  }, [dispatch, modalName])

  const handleClosed = useCallback(() => {
    dispatch(setVisibility({ modal: modalName, visible: false }))
  }, [dispatch, modalName])

  return {
    isOpen: modalState === true,
    modalState,
    onClose: handleClose,
    onClosed: handleClosed
  }
}
