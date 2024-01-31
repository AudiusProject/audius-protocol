import { getLocation as getLocationCommon } from '@audius/common'

import { localStorage } from 'services/local-storage'

import { audiusBackendInstance } from './audius-backend/audius-backend-instance'

export const getLocation = async () => {
  return await getLocationCommon(localStorage, audiusBackendInstance)
}
