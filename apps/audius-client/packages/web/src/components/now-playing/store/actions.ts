import { createCustomAction } from 'typesafe-actions'

import { MessageType } from 'services/native-mobile-interface/types'

export const isCasting = createCustomAction(
  MessageType.IS_CASTING,
  (isCasting: boolean) => ({ isCasting })
)
