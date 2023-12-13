import { sdk } from '@audius/sdk'

let audiusSdk = null

const initAudiusSdk = () => {
  audiusSdk = sdk({ appName: 'Audius Protocol Dashboard' })
}

initAudiusSdk()

export { audiusSdk }
