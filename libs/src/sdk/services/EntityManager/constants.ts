import type { EntityManagerConfig } from './types'

export const defaultEntityManagerConfig: EntityManagerConfig = {
  // Dev address for now
  contractAddress: '0x5b9b42d6e4B2e4Bf8d42Eba32D46918e10899B66',
  web3ProviderUrl: 'http://audius-protocol-poa-ganache-1',
  identityServiceUrl: 'http://audius-protocol-identity-service-1'
}

export const DEFAULT_GAS_LIMIT = 2000000
