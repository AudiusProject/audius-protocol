import { useCallback } from 'react'

import { modalsActions, modalsSelectors } from '@audius/common'
import type { Modals } from '@audius/common'
import type { SetOptional } from 'type-fest'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import type { DrawerProps } from './Drawer'
import { Drawer } from './Drawer'
const { setVisibility } = modalsActions
const { getModalVisibility } = modalsSelectors

export const useDrawerState = (modalName: Modals) => {
  const dispatchWeb = useDispatchWeb()

  const modalState = useSelectorWeb((state) =>
    getModalVisibility(state, modalName)
  )

  const handleClose = useCallback(() => {
    dispatchWeb(setVisibility({ modal: modalName, visible: 'closing' }))
  }, [dispatchWeb, modalName])

  const handleClosed = useCallback(() => {
    dispatchWeb(setVisibility({ modal: modalName, visible: false }))
  }, [dispatchWeb, modalName])

  return {
    isOpen: modalState === true,
    modalState,
    onClose: handleClose,
    onClosed: handleClosed
  }
}

type AppDrawerProps = SetOptional<DrawerProps, 'isOpen' | 'onClose'> & {
  modalName: Modals
}

/*
 * Drawer that hooks into the common modal slice to automatically handle
 * opening and closing.
 */
export const AppDrawer = (props: AppDrawerProps) => {
  const { modalName, onClose: onCloseProp, ...other } = props

  const { isOpen, onClose, onClosed } = useDrawerState(modalName)

  const handleClose = useCallback(() => {
    onClose()
    onCloseProp?.()
  }, [onClose, onCloseProp])

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      onClosed={onClosed}
      {...other}
    />
  )
}
