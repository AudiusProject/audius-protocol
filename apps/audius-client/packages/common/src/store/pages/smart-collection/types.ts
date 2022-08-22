import { SmartCollection } from '../../../models/Collection'
import { SmartCollectionVariant } from '../../../models/SmartCollectionVariant'

export type SmartCollectionState = {
  [key in SmartCollectionVariant]?: SmartCollection
}
