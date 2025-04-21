import { sdk } from '@audius/sdk'

import { discoveryNodeSelector } from './discoveryNodeSelector'

const env = import.meta.env.VITE_ENVIRONMENT

const audiusSdk = sdk({
  appName: 'Audius Protocol Dashboard',
  environment: env,
  services: discoveryNodeSelector ? { discoveryNodeSelector } : undefined
})

export { audiusSdk }
