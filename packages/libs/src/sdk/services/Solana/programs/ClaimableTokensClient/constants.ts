import { PublicKey } from '@solana/web3.js'

import { Env } from '../../../../types/Env'

import type { ClaimableTokensConfigInternal } from './types'

export const defaultClaimableTokensConfig: Record<
  Env,
  ClaimableTokensConfigInternal
> = {
  production: {
    programId: new PublicKey('Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ'),
    rpcEndpoint: 'https://audius-fe.rpcpool.com',
    mints: {
      wAUDIO: new PublicKey('9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM'),
      USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
    }
  },
  staging: {
    programId: new PublicKey('2sjQNmUfkV6yKKi4dPR8gWRgtyma5aiymE3aXL2RAZww'),
    rpcEndpoint: 'https://audius-fe.rpcpool.com',
    mints: {
      wAUDIO: new PublicKey('BELGiMZQ34SDE6x2FUaML2UHDAgBLS64xvhXjX5tBBZo'),
      USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
    }
  },
  development: {
    programId: new PublicKey('testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9'),
    rpcEndpoint: 'http://audius-protocol-solana-test-validator-1',
    mints: {
      wAUDIO: new PublicKey('37RCjhgV1qGV2Q54EHFScdxZ22ydRMdKMtVgod47fDP3'),
      USDC: new PublicKey('26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y')
    }
  }
}
