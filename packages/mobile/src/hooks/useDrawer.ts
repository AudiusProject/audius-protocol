import { useCallback } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import type { AppState } from 'app/store'
import { getData, getVisibility } from 'app/store/drawers/selectors'
import type { Drawer } from 'app/store/drawers/slice'
import { setVisibility } from 'app/store/drawers/slice'

export const useDrawer = <DrawerType extends Drawer>(
  drawerName: DrawerType
) => {
  const dispatch = useDispatch()
  const visibleState = useSelector(getVisibility(drawerName))
  const data = useSelector((state: AppState) =>
    getData<DrawerType>(state, drawerName)
  )

  const isOpen = visibleState === true

  const onClose = useCallback(() => {
    dispatch(setVisibility({ drawer: drawerName, visible: 'closing' }))
  }, [dispatch, drawerName])

  const onClosed = useCallback(() => {
    dispatch(setVisibility({ drawer: drawerName, visible: false }))
  }, [dispatch, drawerName])

  const onOpen = useCallback(
    (data?: any) => {
      dispatch(setVisibility({ drawer: drawerName, visible: true, data }))
    },
    [dispatch, drawerName]
  )

  return { isOpen, onClose, onClosed, onOpen, visibleState, data }
}
