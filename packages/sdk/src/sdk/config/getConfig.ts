import { SdkConfig } from '../types'

import { developmentConfig } from './development'
import { productionConfig } from './production'
import { stagingConfig } from './staging'

export const getConfig = (environment: SdkConfig['environment']) => {
  return environment === 'development'
    ? developmentConfig
    : environment === 'staging'
    ? stagingConfig
    : productionConfig
}
