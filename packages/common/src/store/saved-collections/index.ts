import * as selectors from './selectors'
export {
  default as savedCollectionsReducer,
  actions as savedCollectionsActions
} from './slice'
export const savedCollectionsSelectors = selectors
export { CollectionType } from './types'
