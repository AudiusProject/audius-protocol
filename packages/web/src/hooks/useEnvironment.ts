import { env } from 'services/env'

export const useEnvironment = () => {
  const isDev =
    env.ENVIRONMENT === 'development' ||
    import.meta.env.DEV === true ||
    import.meta.env.MODE === 'development'

  const isStaging = env.ENVIRONMENT === 'staging'

  return {
    isDev,
    isStaging,
    isProduction: !isDev && !isStaging
  }
}
