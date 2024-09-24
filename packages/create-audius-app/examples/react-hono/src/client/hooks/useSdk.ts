import { sdk } from '@audius/sdk'

const apiKey = import.meta.env.VITE_AUDIUS_API_KEY as string
const apiSecret = import.meta.env.VITE_AUDIUS_API_SECRET as string

const instance = sdk({
  apiKey,
  apiSecret
})

export const useSdk = () => ({ sdk: instance })
