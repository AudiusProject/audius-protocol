import { useCallback } from 'react'

import {
  getModalVisibility,
  Modals,
  setVisibility
} from 'audius-client/src/common/store/ui/modals/slice'
import type { SetOptional } from 'type-fest'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { Drawer, DrawerProps } from './Drawer'

type AppDrawerProps = SetOptional<DrawerProps, 'isOpen' | 'onClose'> & {
  modalName: Modals
}

export const AppDrawer = (props: AppDrawerProps) => {
  const { modalName, ...other } = props
  const dispatchWeb = useDispatchWeb()
  const isOpen = useSelectorWeb(state => getModalVisibility(state, modalName))

  const handleClose = useCallback(() => {
    dispatchWeb(setVisibility({ modal: modalName, visible: false }))
  }, [dispatchWeb, modalName])

  return <Drawer isOpen={isOpen} onClose={handleClose} {...other} />
}
