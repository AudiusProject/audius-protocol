import { AudiusQueryContextType } from '@audius/common'

import { apiClient } from 'services/audius-api-client'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { audiusSdk } from 'services/audius-sdk/audiusSdk'
import { env } from 'services/env'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

import { store } from '../store/configureStore'
import { reportToSentry } from '../store/errors/reportToSentry'

export const audiusQueryContext: AudiusQueryContextType = {
  apiClient,
  audiusBackend: audiusBackendInstance,
  audiusSdk,
  dispatch: store.dispatch,
  reportToSentry,
  env,
  fetch,
  remoteConfigInstance
}
