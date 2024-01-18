import { productionConfig } from '../../config'
import { Logger } from '../Logger'

import type { AntiAbuseOracleSelectorConfigInternal } from './types'

export const defaultAntiAbuseOracleSelectorConfig: AntiAbuseOracleSelectorConfigInternal =
  {
    ...productionConfig.antiAbuseOracleNodes,
    logger: new Logger()
  }
