import { Env } from '../../types/Env'
import { Logger } from '../Logger'

import type { EntityManagerConfigInternal } from './types'

export const defaultEntityManagerConfig: Record<
  Env,
  EntityManagerConfigInternal
> = {
  production: {
    contractAddress: '0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64',
    web3ProviderUrl: 'https://poa-gateway.audius.co',
    identityServiceUrl: 'https://identityservice.audius.co',
    useDiscoveryRelay: true,
    logger: new Logger()
  },
  staging: {
    contractAddress: '0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64',
    web3ProviderUrl: 'https://poa-gateway.staging.audius.co',
    identityServiceUrl: 'https://identityservice.staging.audius.co',
    useDiscoveryRelay: true,
    logger: new Logger({ logLevel: 'debug' })
  },
  development: {
    contractAddress: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
    web3ProviderUrl: 'http://audius-protocol-poa-ganache-1',
    identityServiceUrl: 'http://audius-protocol-identity-service-1',
    useDiscoveryRelay: true,
    logger: new Logger({ logLevel: 'debug' })
  }
}

export const DEFAULT_GAS_LIMIT = 2000000
export const CONFIRMATION_POLLING_INTERVAL = 2000
export const CONFIRMATION_TIMEOUT = 45000
