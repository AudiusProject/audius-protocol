import type { AppState } from '../'

import type { Drawer, DrawerData } from './slice'

export const getData = <TDrawer extends keyof DrawerData>(state: AppState) =>
  state.drawers.data as DrawerData[TDrawer]

export const getVisibility = (drawer: Drawer) => (state: AppState) =>
  state.drawers[drawer]

export const getIsOpen = (state: AppState) =>
  Object.values(state.drawers).some((isOpen) => isOpen === true)
