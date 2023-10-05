import { useCallback } from 'react'

import type { SetOptional } from 'type-fest'

import { useDrawer } from 'app/hooks/useDrawer'
import type { Drawer as DrawerName } from 'app/store/drawers/slice'

import type { DrawerProps } from './Drawer'
import Drawer from './Drawer'

type NativeDrawerProps = SetOptional<DrawerProps, 'isOpen' | 'onClose'> & {
  blockClose?: boolean
  drawerName: DrawerName
}

/*
 * Drawer that hooks into the native-drawer slice to automatically handle
 * opening and closing.
 */
export const NativeDrawer = (props: NativeDrawerProps) => {
  const {
    blockClose = false,
    drawerName,
    onClose: onCloseProp,
    ...other
  } = props

  const { isOpen, onClose, onClosed, visibleState } = useDrawer(drawerName)

  const handleClose = useCallback(() => {
    if (blockClose) return
    onCloseProp?.()
    onClose()
  }, [blockClose, onCloseProp, onClose])

  if (visibleState === false) return null

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      onClosed={onClosed}
      {...other}
    />
  )
}
