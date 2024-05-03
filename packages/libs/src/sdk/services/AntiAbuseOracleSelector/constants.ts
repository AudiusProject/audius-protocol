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
    ...productionConfig.antiAbuseOracleNodes,
    logger: new Logger()
  },
  staging: {
    ...stagingConfig.antiAbuseOracleNodes,
    logger: new Logger({ logLevel: 'debug' })
  },
  development: {
    ...developmentConfig.antiAbuseOracleNodes,
    logger: new Logger({ logLevel: 'debug' })
  }
}
