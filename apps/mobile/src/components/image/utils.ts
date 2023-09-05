import Config from 'react-native-config'

export const gateways = [`${Config.USER_NODE}`, `${Config.LEGACY_USER_NODE}`]
// Public gateways to send requests to, ordered by precedence.
export const publicGateways = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
]
