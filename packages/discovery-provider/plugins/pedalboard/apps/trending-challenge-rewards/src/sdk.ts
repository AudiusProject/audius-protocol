import { sdk } from '@audius/sdk' 

export const audiusSdk = () => {
  return sdk({
    appName: 'trending-challenge-rewards',
    environment: process.env.ENVIRONMENT as 'development' | 'staging' | 'production' | undefined ?? 'staging',
  })
}
