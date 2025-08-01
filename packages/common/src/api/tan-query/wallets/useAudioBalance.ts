import { AUDIO, AudioWei, wAUDIO } from '@audius/fixed-decimal'
import type { AudiusSdk } from '@audius/sdk'
import { QueryClient, useQuery } from '@tanstack/react-query'
import { call, getContext } from 'typed-redux-saga'
import { getAddress } from 'viem'

import {
  useQueryContext,
  type QueryContextType
} from '~/api/tan-query/utils/QueryContext'
import { Chain } from '~/models'
import { Feature } from '~/models/ErrorReporting'
import { AudiusBackend } from '~/services'
import { getSDK } from '~/store'
import { toErrorWithMessage } from '~/utils/error'

import { QUERY_KEYS } from '../queryKeys'
import { queryCurrentUserId, queryUser } from '../saga-utils'
import { QueryOptions, type QueryKey } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { useUser } from '../users/useUser'
import { combineQueryResults, useQueries } from '../utils'

import {
  ConnectedWallet,
  getConnectedWalletsQueryFn,
  getConnectedWalletsQueryKey,
  useConnectedWallets
} from './useConnectedWallets'

type UseWalletAudioBalanceParams = {
  /** Ethereum or Solana wallet address */
  address: string
  chain: Chain
  /** Include staked and delegated staked in the balance total */
  includeStaked?: boolean
}

export const getWalletAudioBalanceQueryKey = ({
  address,
  includeStaked,
  chain
}: UseWalletAudioBalanceParams) =>
  [
    QUERY_KEYS.audioBalance,
    chain,
    address,
    { includeStaked }
  ] as unknown as QueryKey<AudioWei>

const fetchWalletAudioBalance = async (
  {
    sdk,
    audiusBackend
  }: {
    sdk: AudiusSdk
    audiusBackend: QueryContextType['audiusBackend']
  },
  { address, includeStaked, chain }: UseWalletAudioBalanceParams
): Promise<AudioWei> => {
  if (chain === Chain.Eth) {
    const checksumWallet = getAddress(address)
    const balance = await sdk.services.audiusTokenClient.balanceOf({
      account: checksumWallet
    })
    if (!includeStaked) {
      return AUDIO(balance).value
    }
    const delegatedBalance =
      await sdk.services.delegateManagerClient.getTotalDelegatorStake({
        delegatorAddress: checksumWallet
      })
    const stakedBalance = await sdk.services.stakingClient.totalStakedFor({
      account: checksumWallet
    })

    return AUDIO(balance + delegatedBalance + stakedBalance).value
  } else {
    try {
      const wAudioSolBalance = await audiusBackend.getAddressWAudioBalance({
        address,
        sdk
      })

      return AUDIO(wAUDIO(BigInt(wAudioSolBalance.toString()))).value
    } catch (error) {
      throw new Error(
        `Failed to fetch Solana AUDIO balance: ${toErrorWithMessage(error).message}`
      )
    }
  }
}

/**
 * Query function for getting the AUDIO balance of an Ethereum or Solana wallet.
 */
export const useWalletAudioBalance = (
  { address, includeStaked, chain }: UseWalletAudioBalanceParams,
  options?: QueryOptions
) => {
  const { audiusSdk, audiusBackend, reportToSentry } = useQueryContext()

  return useQuery({
    queryKey: getWalletAudioBalanceQueryKey({ address, includeStaked, chain }),
    queryFn: async () => {
      try {
        const sdk = await audiusSdk()
        return await fetchWalletAudioBalance(
          { sdk, audiusBackend },
          { address, includeStaked, chain }
        )
      } catch (error) {
        reportToSentry({
          error: toErrorWithMessage(error),
          name: 'AudioBalanceFetchError',
          feature: Feature.TanQuery,
          additionalInfo: { address, chain, includeStaked }
        })
        throw error
      }
    },
    ...options
  })
}

type UseAudioBalancesParams = {
  wallets: Array<{ address: string; chain: Chain }>
  includeStaked?: boolean
}

/**
 * Query function for getting the AUDIO balance of several Ethereum or Solana wallets.
 */
export const useWalletAudioBalances = (
  params: UseAudioBalancesParams,
  options?: QueryOptions
) => {
  const { audiusSdk, audiusBackend, reportToSentry } = useQueryContext()
  return useQueries({
    queries: params.wallets.map(({ address, chain }) => ({
      queryKey: getWalletAudioBalanceQueryKey({
        address,
        chain,
        includeStaked: true
      }),
      queryFn: async () => {
        try {
          const sdk = await audiusSdk()
          const balance = await fetchWalletAudioBalance(
            { sdk, audiusBackend },
            {
              address,
              chain,
              includeStaked: true
            }
          )
          return { address, chain, balance }
        } catch (error) {
          reportToSentry({
            error: toErrorWithMessage(error),
            name: 'AudioBalancesFetchError',
            feature: Feature.TanQuery,
            additionalInfo: { address, chain }
          })
          throw error
        }
      },
      ...options
    })),
    combine: combineQueryResults<
      { balance: AudioWei; address: string; chain: Chain }[]
    >
  })
}

type UseAudioBalanceOptions = {
  /** Whether to include connected/linked wallets in the balance calculation. Defaults to true. */
  includeConnectedWallets?: boolean
}

/**
 * Hook for getting the AUDIO balance of the current user, optionally including connected wallets.
 *
 * NOTE: Does not stay in sync with the store. Won't reflect optimism.
 */
export const useAudioBalance = (options: UseAudioBalanceOptions = {}) => {
  const { includeConnectedWallets = true } = options

  // Get account balances
  const { data: currentUserId } = useCurrentUserId()
  const { data, isSuccess: isUserFetched } = useUser(currentUserId)
  const accountBalances = useWalletAudioBalances(
    {
      wallets: [
        // Include their Hedgehog/auth account wallet
        ...(data?.erc_wallet
          ? [{ address: data.erc_wallet, chain: Chain.Eth }]
          : []),
        // Include their user bank account
        ...(data?.spl_wallet
          ? [{ address: data.spl_wallet, chain: Chain.Sol }]
          : [])
      ]
    },
    { enabled: isUserFetched }
  )
  let accountBalance = AUDIO(0).value
  const isAccountBalanceLoading = accountBalances.isPending
  for (const balanceRes of accountBalances.data ?? []) {
    accountBalance = AUDIO(accountBalance + balanceRes.balance).value
  }

  // Get linked/connected wallets balances
  const {
    data: connectedWallets,
    isFetched: isConnectedWalletsFetched,
    isError: isConnectedWalletsError
  } = useConnectedWallets()
  const connectedWalletsBalances = useWalletAudioBalances(
    {
      wallets: connectedWallets ?? []
    },
    { enabled: isConnectedWalletsFetched && includeConnectedWallets }
  )
  let connectedWalletsBalance = AUDIO(0).value
  const isConnectedWalletsBalanceLoading = includeConnectedWallets
    ? connectedWalletsBalances.isPending
    : false
  if (includeConnectedWallets) {
    for (const balanceRes of connectedWalletsBalances.data ?? []) {
      connectedWalletsBalance = AUDIO(
        connectedWalletsBalance + balanceRes.balance
      ).value
    }
  }

  // Together they are the total balance
  const totalBalance = AUDIO(accountBalance + connectedWalletsBalance).value
  const isLoading = isAccountBalanceLoading || isConnectedWalletsBalanceLoading
  const isError =
    isConnectedWalletsError ||
    accountBalances.isError ||
    connectedWalletsBalances.isError
  return {
    accountBalance,
    connectedWalletsBalance,
    totalBalance,
    isLoading,
    isError
  }
}

// Helper fn for the saga selectors below
function* getWalletBalances(wallets: Array<{ address: string; chain: Chain }>) {
  const sdk = yield* call(getSDK)
  const audiusBackend = yield* getContext<AudiusBackend>(
    'audiusBackendInstance'
  )
  const queryClient = yield* getContext<QueryClient>('queryClient')
  let totalBalance: AudioWei = AUDIO(0).value
  for (const wallet of wallets) {
    const balance = (yield* call([queryClient, queryClient.fetchQuery], {
      queryKey: getWalletAudioBalanceQueryKey({
        address: wallet.address,
        chain: wallet.chain,
        includeStaked: true
      }),
      queryFn: async () =>
        fetchWalletAudioBalance(
          { sdk, audiusBackend },
          { address: wallet.address, chain: wallet.chain, includeStaked: true }
        )
    })) as AudioWei | undefined
    totalBalance = AUDIO(totalBalance + (balance ?? AUDIO(0).value)).value
  }
  return totalBalance
}

export function* getAccountAudioBalanceSaga() {
  const currentUserId = yield* call(queryCurrentUserId)
  const user = yield* call(queryUser, currentUserId)
  const userWallets = [
    ...(user?.erc_wallet
      ? [{ address: user.erc_wallet, chain: Chain.Eth }]
      : []),
    ...(user?.spl_wallet
      ? [{ address: user.spl_wallet, chain: Chain.Sol }]
      : [])
  ]
  return yield* call(getWalletBalances, userWallets)
}

/**
 * Sums current audio account balance combined with balance from all connected wallets
 * @returns
 */
export function* getAccountTotalAudioBalanceSaga() {
  const queryClient = yield* getContext<QueryClient>('queryClient')
  const sdk = yield* call(getSDK)
  const accountBalance = yield* call(getAccountAudioBalanceSaga)
  const currentUserId = yield* call(queryCurrentUserId)
  const connectedWallets = (yield* call([queryClient, queryClient.fetchQuery], {
    queryKey: getConnectedWalletsQueryKey({ userId: currentUserId }),
    queryFn: async () => {
      return getConnectedWalletsQueryFn({
        sdk,
        currentUserId
      })
    }
  })) as ConnectedWallet[]

  const connectedWalletsBalance = yield* call(
    getWalletBalances,
    connectedWallets
  )

  return AUDIO(accountBalance + connectedWalletsBalance).value
}

/**
 * Optimistically updates the user's SOL wallet balance in the cache.
 * Use this to provide immediate UI feedback before the transaction confirms.
 *
 * @param amount - The amount to add (positive) or subtract (negative) from the current balance
 */
export function* optimisticallyUpdateUserSolBalance(amount: AudioWei) {
  const queryClient = yield* getContext<QueryClient>('queryClient')
  const currentUserId = yield* call(queryCurrentUserId)
  const user = yield* call(queryUser, currentUserId)

  if (!user?.spl_wallet) return

  // Update both staked and non-staked balance queries for the SOL wallet
  const solWalletQueries = [
    {
      address: user.spl_wallet,
      chain: Chain.Sol,
      includeStaked: true
    },
    {
      address: user.spl_wallet,
      chain: Chain.Sol,
      includeStaked: false
    }
  ]

  for (const queryParams of solWalletQueries) {
    const queryKey = getWalletAudioBalanceQueryKey(queryParams)

    yield* call(
      [queryClient, queryClient.setQueryData],
      queryKey,
      (oldBalance: AudioWei | undefined) => {
        const currentBalance = oldBalance ?? AUDIO(0).value
        const newBalance = AUDIO(currentBalance + amount).value
        // Ensure balance doesn't go negative
        return newBalance >= 0 ? newBalance : AUDIO(0).value
      }
    )
  }
}

/**
 * Optimistically decreases the user's SOL wallet balance.
 * Use this when sending AUDIO to provide immediate UI feedback.
 *
 * @param amount - The amount to subtract from the current balance
 */
export function* optimisticallyDecreaseUserSolBalance(amount: AudioWei) {
  yield* call(optimisticallyUpdateUserSolBalance, AUDIO(-amount).value)
}

/**
 * Optimistically increases the user's SOL wallet balance.
 * Use this when receiving AUDIO to provide immediate UI feedback.
 *
 * @param amount - The amount to add to the current balance
 */
export function* optimisticallyIncreaseUserSolBalance(amount: AudioWei) {
  yield* call(optimisticallyUpdateUserSolBalance, amount)
}

/**
 * Reverts an optimistic balance update by invalidating the cache.
 * Use this when a transaction fails and you need to revert to the real balance.
 */
export function* revertOptimisticUserSolBalance() {
  const queryClient = yield* getContext<QueryClient>('queryClient')
  const currentUserId = yield* call(queryCurrentUserId)
  const user = yield* call(queryUser, currentUserId)

  if (!user?.spl_wallet) return

  // Invalidate both staked and non-staked balance queries
  const solWalletQueries = [
    {
      address: user.spl_wallet,
      chain: Chain.Sol,
      includeStaked: true
    },
    {
      address: user.spl_wallet,
      chain: Chain.Sol,
      includeStaked: false
    }
  ]

  for (const queryParams of solWalletQueries) {
    const queryKey = getWalletAudioBalanceQueryKey(queryParams)
    queryClient.invalidateQueries({ queryKey })
  }
}
