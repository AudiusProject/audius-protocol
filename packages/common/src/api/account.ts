import { Id } from '@audius/sdk'
import dayjs from 'dayjs'
import { useSelector } from 'react-redux'

import { managedUserListFromSDK, userManagerListFromSDK } from '~/adapters/user'
import { createApi } from '~/audius-query'
import { AccountUserMetadata, ID, User, UserMetadata } from '~/models'
import { getWalletAddresses } from '~/store/account/selectors'

import { SelectableQueryOptions } from './tan-query/types'
import { useWalletAccount } from './tan-query/users/account/useWalletUser'

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

export const useGetCurrentUser = <TResult = UserMetadata | undefined>(
  options?: SelectableQueryOptions<
    AccountUserMetadata | null | undefined,
    TResult
  >
) => {
  const { currentUser } = useSelector(getWalletAddresses)

  return useWalletAccount<TResult>(currentUser, {
    select: (data: AccountUserMetadata | null | undefined): TResult =>
      data?.user as TResult,
    ...options
  })
}

export const useGetCurrentWeb3User = <TResult = UserMetadata | undefined>(
  options?: SelectableQueryOptions<
    AccountUserMetadata | null | undefined,
    TResult
  >
) => {
  const { web3User } = useSelector(getWalletAddresses)

  return useWalletAccount<TResult>(web3User, {
    select: (data: AccountUserMetadata | null | undefined): TResult =>
      data?.user as TResult,
    ...options
  })
}

export const useGetCurrentUserId = <TResult = number | undefined>(
  options?: SelectableQueryOptions<
    AccountUserMetadata | null | undefined,
    TResult
  >
) => {
  return useGetCurrentUser<TResult>({
    select: (accountData: AccountUserMetadata | null | undefined): TResult =>
      accountData?.user.user_id as TResult,
    ...options
  })
}

export const accountApiReducer = accountApi.reducer
