import { USER_NODE, LEGACY_USER_NODE } from 'services/AudiusBackend'

export const getCreatorNodeIPFSGateways = (endpoint) => {
  if (endpoint) {
    return endpoint
      .split(',')
      .filter(Boolean)
      .map((endpoint) => `${endpoint}/ipfs/`)
  }
  const gateways = [`${USER_NODE}/ipfs/`]
  if (LEGACY_USER_NODE) {
    gateways.push(`${LEGACY_USER_NODE}/ipfs/`)
  }
  return gateways
}
