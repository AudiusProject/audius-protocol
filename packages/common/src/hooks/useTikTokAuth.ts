import dayjs from 'utils/dayjs'

type CreateUseTikTokAuthHookArguments = {
  authenticate: () => Promise<Credentials>
  handleError: (e: Error) => void
  getLocalStorageItem: (key: string) => Promise<string | null>
  setLocalStorageItem: (key: string, value: string) => Promise<void>
  // Should the credentials be cached in local storage
  cacheInLocalStorage?: boolean
}

export type UseTikTokAuthArguments = {
  onError: (e: Error) => void
}

type WithAuthCallback = (accessToken: string, openId: string) => void

export type Credentials = {
  accessToken: string
  openId: string
  expiresIn: string
}

/**
 * A hook that returns a withAuth function that can be passed a function which will
 * be provided with the TikTok credentials on existing or successful auth
 */
export const createUseTikTokAuthHook =
  ({
    authenticate,
    handleError,
    getLocalStorageItem,
    setLocalStorageItem,
    cacheInLocalStorage = false
  }: CreateUseTikTokAuthHookArguments) =>
  ({
    onError: errorCallback
  }: UseTikTokAuthArguments): ((callback: WithAuthCallback) => void) => {
    const onError = (e: Error) => {
      // First handle the error as specified by the arguments to createUseTikTokAuthHook
      handleError(e)
      // Secondly invoke the callback passed to the useTikTokAuth hook itself
      errorCallback(e)
    }

    const withAuth = async (callback: WithAuthCallback) => {
      if (cacheInLocalStorage) {
        const accessToken = await getLocalStorageItem('tikTokAccessToken')
        const openId = await getLocalStorageItem('tikTokOpenId')
        const expiration = await getLocalStorageItem(
          'tikTokAccessTokenExpiration'
        )
        const isExpired = expiration && dayjs().isAfter(dayjs(expiration))

        if (accessToken && openId && !isExpired) {
          callback(accessToken, openId)
        }
      } else {
        try {
          const credentials = await authenticate()
          if (cacheInLocalStorage) {
            await storeAccessToken(credentials)
          }
          callback(credentials.accessToken, credentials.openId)
        } catch (e) {
          onError(e as Error)
        }
      }
    }

    const storeAccessToken = async ({
      accessToken,
      openId,
      expiresIn
    }: Credentials) => {
      await setLocalStorageItem('tikTokAccessToken', accessToken)
      await setLocalStorageItem('tikTokOpenId', openId)

      const expirationDate = dayjs()
        .add(Number.parseInt(expiresIn), 's')
        .format()
      await setLocalStorageItem('tikTokAccessTokenExpiration', expirationDate)
    }

    return withAuth
  }
