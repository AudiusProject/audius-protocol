import { SmartCollectionVariant } from 'common/models/SmartCollectionVariant'
import { CommonState } from 'common/store'

const getBaseState = (state: CommonState) => state.pages.smartCollection

export const getCollection = (
  state: CommonState,
  { variant }: { variant: SmartCollectionVariant }
) => getBaseState(state)[variant]
