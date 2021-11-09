import { useDispatch, useSelector } from 'react-redux'

import { getVisibility } from 'app/store/drawers/selectors'
import { Drawer, setVisibility } from 'app/store/drawers/slice'

/**
 * Hook to get and set the visibility of a drawer
 * @param drawer
 * @returns [isOpen, setIsOpen]
 *
 * Example:
 *
 * const [isOpen, setIsOpen] = useDrawer('EnablePushNotificationsReminder')
 */
export const useDrawer = (
  drawer: Drawer
): [boolean, (isVisible: boolean) => void] => {
  const dispatch = useDispatch()
  const isOpen = useSelector(getVisibility(drawer))
  const setIsOpen = (visible: boolean) =>
    dispatch(setVisibility({ drawer, visible }))

  return [isOpen, setIsOpen]
}
