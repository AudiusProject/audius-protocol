import type { Environment } from '@audius/common'

export const env = {
  EAGER_DISCOVERY_NODES: process.env.REACT_APP_EAGER_DISCOVERY_NODES,
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT as Environment
}
