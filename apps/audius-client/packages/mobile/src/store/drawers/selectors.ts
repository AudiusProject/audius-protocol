import type { AppState } from '../'

import type { Drawer } from './slice'

export const getData = (state: AppState) => state.drawers.data

export const getVisibility = (drawer: Drawer) => (state: AppState) =>
  state.drawers[drawer]

export const getIsOpen = (state: AppState) =>
  Object.values(state.drawers).some((isOpen) => isOpen)
