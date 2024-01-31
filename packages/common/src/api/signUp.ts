import { isEmpty } from 'lodash'

import { createApi } from '~/audius-query'
import { FeatureFlags } from '~/services/remote-config/feature-flags'
import { IntKeys } from '~/services/remote-config/types'
import { parseHandleReservedStatusFromSocial } from '~/utils/handleReservedStatus'
import { promiseWithTimeout } from '~/utils/promiseWithTimeout'

import { userApiFetch } from './user'

const DEFAULT_HANDLE_VERIFICATION_TIMEOUT_MILLIS = 5_000

const signUpApi = createApi({
  reducerPath: 'signUpApi',
  endpoints: {
    isEmailInUse: {
      fetch: async ({ email }: { email: string }, { audiusBackend }) => {
        return await audiusBackend.emailInUse(email)
      },
      options: {}
    },
    isHandleInUse: {
      fetch: async ({ handle }: { handle: string }, context) => {
        const user = await userApiFetch.getUserByHandle(
          {
            handle,
            currentUserId: null,
            retry: false
          },
          context
        )
        return !isEmpty(user)
      },
      options: {}
    },
    getHandleReservedStatus: {
      fetch: async (
        { handle }: { handle: string },
        { audiusBackend, remoteConfigInstance, env }
      ) => {
        const handleCheckTimeout =
          remoteConfigInstance.getRemoteVar(
            IntKeys.HANDLE_VERIFICATION_TIMEOUT_MILLIS
          ) ?? DEFAULT_HANDLE_VERIFICATION_TIMEOUT_MILLIS

        if (env.ENVIRONMENT === 'production') {
          const twitterCheckPromise = remoteConfigInstance.getFeatureEnabled(
            FeatureFlags.VERIFY_HANDLE_WITH_TWITTER
          )
            ? promiseWithTimeout(
                audiusBackend.twitterHandle(handle),
                handleCheckTimeout
              )
            : null

          const instagramCheckPromise = remoteConfigInstance.getFeatureEnabled(
            FeatureFlags.VERIFY_HANDLE_WITH_INSTAGRAM
          )
            ? promiseWithTimeout(
                audiusBackend.instagramHandle(handle),
                handleCheckTimeout
              )
            : null
          const tiktokCheckPromise = remoteConfigInstance.getFeatureEnabled(
            FeatureFlags.VERIFY_HANDLE_WITH_TIKTOK
          )
            ? promiseWithTimeout(
                audiusBackend.tiktokHandle(handle),
                handleCheckTimeout
              )
            : null
          const [twitterResult, instagramResult, tiktokResult] =
            await Promise.all([
              twitterCheckPromise,
              instagramCheckPromise,
              tiktokCheckPromise
            ])
          const lookedUpTwitterUser =
            twitterResult == null
              ? null
              : twitterResult?.data?.user?.profile?.[0]
          const lookedUpInstagramUser =
            instagramResult == null ? null : instagramResult?.data
          const lookedUpTikTokUser =
            tiktokResult == null ? null : tiktokResult?.data

          const reservedStatus = parseHandleReservedStatusFromSocial({
            isOauthVerified: false,
            lookedUpTwitterUser,
            lookedUpInstagramUser,
            lookedUpTikTokUser
          })
          return reservedStatus
        } else {
          return 'notReserved'
        }
      },
      options: {}
    }
  }
})

export const { useIsEmailInUse } = signUpApi.hooks
export const signUpReducer = signUpApi.reducer
export const signUpFetch = signUpApi.fetch
