import { ID } from '~/models/Identifiers'

export type RemixersPageState = {
  id: ID | null
  trackId: ID | undefined
}

export const REMIXERS_USER_LIST_TAG = 'REMIXERS'
