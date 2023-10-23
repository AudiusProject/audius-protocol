import { Environment } from '@audius/common'

export const env = {
  AAO_ENDPOINT: import.meta.env.VITE_AAO_ENDPOINT,
  EAGER_DISCOVERY_NODES: import.meta.env.VITE_EAGER_DISCOVERY_NODES,
  EXPLORE_CONTENT_URL: import.meta.env.VITE_EXPLORE_CONTENT_URL,
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT as Environment,
  ORACLE_ETH_ADDRESSES: import.meta.env.VITE_ORACLE_ETH_ADDRESSES,
  SUGGESTED_FOLLOW_HANDLES: import.meta.env
    .VITE_SUGGESTED_FOLLOW_HANDLES as string,
  GENERAL_ADMISSION: import.meta.env.VITE_GENERAL_ADMISSION,
  IDENTITY_SERVICE: import.meta.env.VITE_IDENTITY_SERVICE,
  PUBLIC_HOSTNAME: import.meta.env.VITE_PUBLIC_HOSTNAME
}
