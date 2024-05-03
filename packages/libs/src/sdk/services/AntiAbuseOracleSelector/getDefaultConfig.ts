import type { SdkServicesConfig } from '../../config/types'
import { Logger } from '../Logger'

import type { AntiAbuseOracleSelectorConfigInternal } from './types'

export const getDefaultAntiAbuseOracleSelectorConfig = (
  config: SdkServicesConfig
): AntiAbuseOracleSelectorConfigInternal => ({
  registeredAddresses: config.network.antiAbuseOracleNodes.registeredAddresses,
  endpoints: config.network.antiAbuseOracleNodes.endpoints,
  logger: new Logger()
})
