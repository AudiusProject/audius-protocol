import { env } from 'services/env'

export const useIsDevOrStaging = () => {
  return (
    env.ENVIRONMENT === 'development' ||
    env.ENVIRONMENT === 'staging' ||
    import.meta.env.DEV === true ||
    import.meta.env.MODE === 'development'
  )
}
