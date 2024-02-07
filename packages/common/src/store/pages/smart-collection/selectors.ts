import { CommonState } from '~/store/commonStore'

import { SmartCollectionVariant } from '../../../models/SmartCollectionVariant'

const getBaseState = (state: CommonState) => state.pages.smartCollection

export const getCollection = (
  state: CommonState,
  { variant }: { variant: SmartCollectionVariant }
) => getBaseState(state)[variant]
