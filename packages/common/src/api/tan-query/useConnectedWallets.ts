import { Id } from '@audius/sdk'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { Chain, type ID } from '~/models'
import { profilePageActions } from '~/store/pages'
import { walletActions } from '~/store/wallet'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { getUserCollectiblesQueryKey } from './useUserCollectibles'

export type ConnectedWallet = {
  address: string
  chain: Chain
  isPending?: boolean
}

export const getConnectedWalletsQueryKey = ({
  userId
}: {
  userId: ID | null
}) => [QUERY_KEYS.connectedWallets, userId]

export const useConnectedWallets = (options?: QueryOptions) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: getConnectedWalletsQueryKey({ userId: currentUserId }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.users.getConnectedWallets({
        id: Id.parse(currentUserId)
      })
      return data?.ercWallets
        ?.map<ConnectedWallet>((address) => ({
          address,
          chain: Chain.Eth
        }))
        .concat(
          data?.splWallets?.map((address) => ({
            address,
            chain: Chain.Sol
          }))
        )
    },
    ...options
  })
}

type AddConnectedWalletParams = {
  wallet: ConnectedWallet
  signature: string
}

export const useAddConnectedWallet = () => {
  const queryClient = useQueryClient()
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  // for priming cache
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: async ({ wallet, signature }: AddConnectedWalletParams) => {
      const sdk = await audiusSdk()
      await sdk.users.addAssociatedWallet({
        userId: Id.parse(currentUserId),
        wallet,
        signature
      })
    },
    onMutate: async (params) => {
      // Cache old state
      const previousAssociatedWallets = queryClient.getQueryData<
        ConnectedWallet[]
      >(getConnectedWalletsQueryKey({ userId: currentUserId }))

      if (!previousAssociatedWallets) {
        return { previousAssociatedWallets: [] }
      }

      // Optimistically add the new wallet
      queryClient.setQueryData(
        getConnectedWalletsQueryKey({ userId: currentUserId }),
        (old: ConnectedWallet[]) => [
          ...old,
          { ...params.wallet, isPending: true }
        ]
      )

      return { previousAssociatedWallets }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: getConnectedWalletsQueryKey({ userId: currentUserId })
      })
      queryClient.invalidateQueries({
        queryKey: getUserCollectiblesQueryKey({ userId: currentUserId })
      })

      // Temporarily manually refetch relevant redux states
      // TODO: Remove once consumers of the redux store migrate to tanquery
      dispatch(walletActions.getBalance())
      dispatch(
        profilePageActions.fetchProfile(
          null,
          currentUserId,
          false,
          false,
          false
        )
      )
    },
    onError: (error, _newWallet, context) => {
      queryClient.setQueryData(
        getConnectedWalletsQueryKey({ userId: currentUserId }),
        context?.previousAssociatedWallets
      )
      reportToSentry({
        error,
        name: 'Add Connected Wallet'
      })
    }
  })
}

export type RemoveConnectedWalletParams = {
  wallet: { address: string; chain: Chain }
}

export const useRemoveConnectedWallet = () => {
  const queryClient = useQueryClient()
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  // for priming cache
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: async ({ wallet }: RemoveConnectedWalletParams) => {
      const sdk = await audiusSdk()
      const response = await sdk.users.removeAssociatedWallet({
        userId: Id.parse(currentUserId),
        wallet
      })
      return response
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getConnectedWalletsQueryKey({ userId: currentUserId })
      })
      queryClient.invalidateQueries({
        queryKey: getUserCollectiblesQueryKey({ userId: currentUserId })
      })

      // Temporarily manually refetch relevant redux states
      // TODO: Remove once consumers of the redux store migrate to tanquery
      dispatch(walletActions.getBalance())
      dispatch(
        profilePageActions.fetchProfile(
          null,
          currentUserId,
          false,
          false,
          false
        )
      )
    },
    onError: (error) => {
      reportToSentry({
        error,
        name: 'Remove Connected Wallet'
      })
    }
  })
}
