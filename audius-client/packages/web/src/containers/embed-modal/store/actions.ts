import { createCustomAction } from 'typesafe-actions'

import { ID, PlayableType } from 'common/models/Identifiers'

export const OPEN = 'EMBED_MODAL/OPEN'
export const CLOSE = 'EMBED_MODAL/CLOSE'

export const open = createCustomAction(OPEN, (id: ID, kind: PlayableType) => ({
  id,
  kind
}))
export const close = createCustomAction(CLOSE, () => ({}))
