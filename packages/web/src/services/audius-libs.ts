import { AudiusLibs } from '@audius/sdk-legacy/dist/libs'

import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'

export const getLibs = async (): Promise<AudiusLibs> => {
  await waitForLibsInit()
  const libs: AudiusLibs = window.audiusLibs
  return libs
}
