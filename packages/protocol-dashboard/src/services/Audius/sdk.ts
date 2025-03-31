import { sdk } from '@audius/sdk'

const env = import.meta.env.VITE_ENVIRONMENT
const audiusSdk = sdk({
  appName: 'Audius Protocol Dashboard',
  environment: env
})

export { audiusSdk }
