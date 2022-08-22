import { SmartCollectionVariant } from '../../../models/SmartCollectionVariant'
import { CommonState } from 'store/commonStore'

const getBaseState = (state: CommonState) => state.pages.smartCollection

export const getCollection = (
  state: CommonState,
  { variant }: { variant: SmartCollectionVariant }
) => getBaseState(state)[variant]
