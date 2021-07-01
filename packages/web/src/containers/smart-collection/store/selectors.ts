import { AppState } from 'store/types'

import { SmartCollectionVariant } from '../types'

const getBaseState = (state: AppState) =>
  state.application.pages.smartCollection

export const getCollection = (
  state: AppState,
  { variant }: { variant: SmartCollectionVariant }
) => getBaseState(state)[variant]
