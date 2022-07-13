import { useCallback } from 'react'

import type { SetOptional } from 'type-fest'

import { useDrawer } from 'app/hooks/useDrawer'
import { Drawer as DrawerName } from 'app/store/drawers/slice'

import Drawer, { DrawerProps } from './Drawer'

type NativeDrawerProps = SetOptional<DrawerProps, 'isOpen' | 'onClose'> & {
  drawerName: DrawerName
}

/*
 * Drawer that hooks into the native-drawer slice to automatically handle
 * opening and closing.
 */
export const NativeDrawer = (props: NativeDrawerProps) => {
  const { drawerName, onClose: onCloseProp, ...other } = props

  const { isOpen, onClose, onClosed } = useDrawer(drawerName)

  const handleClose = useCallback(() => {
    onCloseProp?.()
    onClose()
  }, [onCloseProp, onClose])

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      onClosed={onClosed}
      {...other}
    />
  )
}
