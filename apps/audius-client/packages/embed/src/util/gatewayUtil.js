export const formatGateways = (gatewayString) => {
  if (!gatewayString) return null
  return gatewayString.split(',').map((gateway) => `${gateway.trim()}/ipfs/`)
}
