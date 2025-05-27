import { AUDIO, AudioWei, wAUDIO } from '@audius/fixed-decimal'
import type { AudiusSdk } from '@audius/sdk'
import {
  getAccount,
  getAssociatedTokenAddressSync,
  TokenAccountNotFoundError
} from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getAddress } from 'viem'

import { useQueryContext } from '~/api/tan-query/utils/QueryContext'
import { Chain } from '~/models'
import type { Env } from '~/services'

import { QUERY_KEYS } from '../queryKeys'
import { QueryOptions, type QueryKey } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { useUser } from '../users/useUser'

import { useConnectedWallets } from './useConnectedWallets'

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
  { sdk, env }: { sdk: AudiusSdk; env: Env },
  { address, includeStaked, chain }: UseWalletAudioBalanceParams
) => {
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
    const connection = sdk.services.solanaClient.connection
    const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
      new PublicKey(env.WAUDIO_MINT_ADDRESS),
      new PublicKey(address)
    )
    try {
      const associatedTokenAccount = await getAccount(
        connection,
        associatedTokenAccountAddress
      )
      return AUDIO(wAUDIO(associatedTokenAccount.amount)).value
    } catch (e) {
      if (e instanceof TokenAccountNotFoundError) {
        // If the account does not exist, return 0 AUDIO balance
        return AUDIO(0).value
      }
      throw e
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
  const { audiusSdk, env } = useQueryContext()

  return useQuery({
    queryKey: getWalletAudioBalanceQueryKey({ address, includeStaked, chain }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      return await fetchWalletAudioBalance(
        { sdk, env },
        { address, includeStaked, chain }
      )
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
  options?: QueryOptions<AudioWei>
) => {
  const { audiusSdk, env } = useQueryContext()
  return useQueries({
    queries: params.wallets.map(({ address, chain }) => ({
      queryKey: getWalletAudioBalanceQueryKey({
        address,
        chain,
        includeStaked: true
      }),
      queryFn: async () => {
        const sdk = await audiusSdk()
        return await fetchWalletAudioBalance(
          { sdk, env },
          {
            address,
            chain,
            includeStaked: true
          }
        )
      },
      ...options
    }))
  })
}

/**
 * Hook for getting the AUDIO balance of the current user, including connected wallets.
 *
 * NOTE: Does not stay in sync with the store. Won't reflect optimism.
 */
export const useAudioBalance = () => {
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
  let accountBalance = BigInt(0)
  for (const balanceRes of accountBalances) {
    accountBalance += balanceRes?.data ?? BigInt(0)
  }

  // Get linked/connected wallets balances
  const { data: connectedWallets, isFetched: isConnectedWalletsFetched } =
    useConnectedWallets()
  const connectedWalletsBalances = useWalletAudioBalances(
    {
      wallets: connectedWallets!
    },
    { enabled: isConnectedWalletsFetched }
  )
  let connectedWalletsBalance = BigInt(0)
  for (const balanceRes of connectedWalletsBalances) {
    connectedWalletsBalance += balanceRes?.data ?? BigInt(0)
  }

  // Together they are the total balance
  const totalBalance = accountBalance + connectedWalletsBalance
  return { accountBalance, connectedWalletsBalance, totalBalance }
}
