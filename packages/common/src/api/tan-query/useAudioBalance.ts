import { AUDIO, wAUDIO } from '@audius/fixed-decimal'
import type { AudiusSdk } from '@audius/sdk'
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getAddress } from 'viem'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { Chain } from '~/models'
import type { Env } from '~/services'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

type UseWalletBalanceParams = {
  /** Ethereum or Solana wallet address */
  address: string
  chain: Chain
  /** Include staked and delegated staked in the balance total */
  includeStaked?: boolean
}

export const getAudioBalanceQueryKey = ({
  address,
  includeStaked,
  chain
}: UseWalletBalanceParams) => [
  QUERY_KEYS.audioBalance,
  chain,
  address,
  includeStaked
]

const fetchAudioBalance = async (
  { sdk, env }: { sdk: AudiusSdk; env: Env },
  { address, includeStaked, chain }: UseWalletBalanceParams
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
      await sdk.services.delegateManagerClient.contract.getTotalDelegatorStake({
        delegatorAddress: checksumWallet
      })
    const stakedBalance =
      await sdk.services.stakingClient.contract.totalStakedFor({
        account: checksumWallet
      })

    return AUDIO(balance + delegatedBalance + stakedBalance).value
  } else {
    const connection = sdk.services.solanaClient.connection
    const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
      new PublicKey(env.WAUDIO_MINT_ADDRESS),
      new PublicKey(address)
    )
    const associatedTokenAccount = await getAccount(
      connection,
      associatedTokenAccountAddress
    )
    return AUDIO(wAUDIO(associatedTokenAccount.amount)).value
  }
}

/**
 * Query function for getting the AUDIO balance of an Ethereum or Solana wallet.
 */
export const useAudioBalance = (
  { address, includeStaked, chain }: UseWalletBalanceParams,
  options?: QueryOptions
) => {
  const { audiusSdk, env } = useAudiusQueryContext()

  return useQuery({
    queryKey: getAudioBalanceQueryKey({ address, includeStaked, chain }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      return await fetchAudioBalance(
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
export const useAudioBalances = (
  params: UseAudioBalancesParams,
  options?: QueryOptions
) => {
  const { audiusSdk, env } = useAudiusQueryContext()
  return useQueries({
    queries: params.wallets.map(({ address, chain }) => ({
      queryKey: getAudioBalanceQueryKey({
        address,
        chain,
        includeStaked: true
      }),
      queryFn: async () => {
        const sdk = await audiusSdk()
        return await fetchAudioBalance(
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
