import { getRegisteredDiscoveryNodes } from '../utils/getRegisteredDiscoveryNodes'
import { Redis } from 'ioredis'
import type Logger from 'bunyan'

export async function isRegisteredDiscoveryNode({
  discoveryNodeDelegateOwnerWallet,
  libs,
  logger,
  redis
}: {
  discoveryNodeDelegateOwnerWallet: string
  libs: any
  logger: Logger
  redis: Redis
}) {
  const allRegisteredDiscoveryNodes = await getRegisteredDiscoveryNodes({
    libs,
    logger,
    redis
  })
  return allRegisteredDiscoveryNodes.some(
    (node) => node.delegateOwnerWallet === discoveryNodeDelegateOwnerWallet
  )
}
