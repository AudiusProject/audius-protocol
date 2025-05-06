import { useMemo } from 'react'

import { Id } from '@audius/sdk'
import dayjs from 'dayjs'

import { managedUserListFromSDK, userManagerListFromSDK } from '~/adapters/user'
import { createApi } from '~/audius-query'
import { ID, User, UserMetadata } from '~/models'

import {
  CurrentUserWalletType,
  useCurrentAccount
} from './tan-query/users/account/useCurrentAccount'

type ResetPasswordArgs = {
  email: string
  password: string
}

type RequestAddManagerPayload = {
  userId: number
  managerUser: UserMetadata | User
}

type RemoveManagerPayload = {
  userId: number
  managerUserId: number
}

type ApproveManagedAccountPayload = {
  userId: number
  grantorUser: UserMetadata | User
}

const accountApi = createApi({
  reducerPath: 'accountApi',
  endpoints: {}
})

// TODO: this is temporary jank to scope down changes - this will go soon when removing this whole file
export const useGetCurrentUser = (_args?: any, options?: any) => {
  return {
    data: useCurrentAccount(CurrentUserWalletType.currentUser, options)?.data
      ?.user
  }
}

// TODO: this is temporary jank to scope down changes - this will go soon when removing this whole file
export const useGetCurrentWeb3User = (_args?: any, options?: any) => {
  return {
    data: useCurrentAccount(CurrentUserWalletType.web3User, options)?.data?.user
  }
}

// TODO: this is temporary jank to scope down changes - this will go soon when removing this whole file
export const useGetCurrentUserId = (_args?: any, options?: any) => {
  const result = useGetCurrentUser(_args, options)
  return useMemo(() => {
    return {
      ...result,
      data: result.data ? result.data.user_id : null
    }
  }, [result])
}

export const accountApiReducer = accountApi.reducer
