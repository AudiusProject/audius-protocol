import { Environment } from '@audius/common'

export const env = {
  EAGER_DISCOVERY_NODES: process.env.REACT_APP_EAGER_DISCOVERY_NODES,
  EXPLORE_CONTENT_URL: process.env.REACT_APP_EXPLORE_CONTENT_URL,
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT as Environment
}
