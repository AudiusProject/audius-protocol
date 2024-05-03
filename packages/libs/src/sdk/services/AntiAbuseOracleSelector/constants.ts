import {
  developmentConfig,
  productionConfig,
  stagingConfig
} from '../../config'
import { Env } from '../../types/Env'
import { Logger } from '../Logger'

import type { AntiAbuseOracleSelectorConfigInternal } from './types'

export const defaultAntiAbuseOracleSelectorConfig: Record<
  Env,
  AntiAbuseOracleSelectorConfigInternal
> = {
  production: {
    registeredAddresses: productionConfig.antiAbuseOracleNodeWallets,
    endpoints: [
      'https://antiabuseoracle.audius.co',
      'https://audius-oracle.creatorseed.com',
      'https://oracle.audius.endl.net'
    ],
    logger: new Logger()
  },
  staging: {
    registeredAddresses: stagingConfig.antiAbuseOracleNodeWallets,
    endpoints: ['https://antiabuseoracle.staging.audius.co'],
    logger: new Logger({ logLevel: 'debug' })
  },
  development: {
    registeredAddresses: developmentConfig.antiAbuseOracleNodeWallets,
    endpoints: ['http://audius-protocol-anti-abuse-oracle-1:8000'],
    logger: new Logger({ logLevel: 'debug' })
  }
}
