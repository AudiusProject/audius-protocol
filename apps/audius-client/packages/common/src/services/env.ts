export type Environment = 'development' | 'staging' | 'production'

export type Env = {
  EAGER_DISCOVERY_NODES?: string
  EXPLORE_CONTENT_URL?: string
  ENVIRONMENT?: Environment
}
