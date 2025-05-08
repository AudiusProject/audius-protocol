import { env } from 'services/env'

export const useEnvironment = () => {
  const isDev =
    env.ENVIRONMENT === 'development' ||
    import.meta.env.DEV === true ||
    import.meta.env.MODE === 'development'

  const isDevOrStaging = env.ENVIRONMENT === 'staging' || isDev

  return {
    isDev,
    isStaging: env.ENVIRONMENT === 'staging',
    isProduction: !isDevOrStaging
  }
}
