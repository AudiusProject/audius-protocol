import { useCallback } from 'react'

import { useDispatch } from 'react-redux'

import {
  getModalVisibility,
  Modals,
  setVisibility
} from 'common/store/ui/modals/slice'
import { useSelector } from 'utils/reducer'

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
