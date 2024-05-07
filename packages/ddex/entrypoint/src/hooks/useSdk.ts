import { sdk } from '@audius/sdk'

const env = import.meta.env.VITE_ENVIRONMENT as 'dev' | 'stage' | 'prod'

const instance = sdk({
  appName: 'ddex',
  environment:
    env === 'dev' ? 'development' : env === 'stage' ? 'staging' : 'production'
})

export const useSdk = () => ({ sdk: instance })
