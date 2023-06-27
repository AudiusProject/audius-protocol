export const formatGateways = (gatewayString) => {
  return gatewayString.split(',').map((gateway) => `${gateway.trim()}/ipfs/`)
}
