import { sdk } from '@audius/sdk'

let audiusSdk = null

const initAudiusSdk = () => {
  audiusSdk = sdk({ appName: 'Audius Embed Player' })
}

initAudiusSdk()

export { audiusSdk }
