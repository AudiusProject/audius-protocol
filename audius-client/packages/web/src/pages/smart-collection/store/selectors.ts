import { SmartCollectionVariant } from 'common/models/SmartCollectionVariant'
import { AppState } from 'store/types'

const getBaseState = (state: AppState) =>
  state.application.pages.smartCollection

export const getCollection = (
  state: AppState,
  { variant }: { variant: SmartCollectionVariant }
) => getBaseState(state)[variant]
