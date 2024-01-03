export type Environment = 'development' | 'staging' | 'production'

export type Env = {
  AAO_ENDPOINT?: string
  EAGER_DISCOVERY_NODES?: string
  EXPLORE_CONTENT_URL?: string
  ENVIRONMENT?: Environment
  ORACLE_ETH_ADDRESSES?: string
  SUGGESTED_FOLLOW_HANDLES?: string
  GENERAL_ADMISSION?: string
  IDENTITY_SERVICE?: string
  PUBLIC_HOSTNAME?: string
}
