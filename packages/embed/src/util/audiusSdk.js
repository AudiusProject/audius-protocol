import { sdk } from '@audius/sdk'

const appName = process.env.VITE_APP_NAME
const apiKey = process.env.VITE_API_KEY

let audiusSdk = null

const initAudiusSdk = () => {
  audiusSdk = sdk({ appName, apiKey })
}

initAudiusSdk()

export { audiusSdk }
