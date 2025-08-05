import { AUDIO, wAUDIO, FixedDecimal } from '@audius/fixed-decimal'
import { QueryClient } from '@tanstack/react-query'

import { Chain } from '~/models'
import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'

import { optimisticallyUpdateWalletAudioBalance } from '../wallets/useAudioBalance'
import {
  getTokenBalanceQueryKey,
  type TokenBalanceQueryData
} from '../wallets/useTokenBalance'

import { SwapTokensParams } from './types'

/**
 * Updates the wAUDIO balance in the cache optimistically based on Jupiter swap parameters.
 * Assumes swaps are always with the user's Solana SPL wallet.
 *
 * @param queryClient - The query client to update
 * @param params - The swap parameters containing the input and output tokens and amounts
 * @param estimatedOutputAmount - The estimated output amount from the quote
 * @param solWalletAddress - The user's Solana wallet address (for SPL tokens)
 */
export const updateAudioBalanceOptimistically = (
  queryClient: QueryClient,
  params: SwapTokensParams,
  estimatedOutputAmount: number | undefined,
  solWalletAddress?: string | null
) => {
  const {
    inputMint: inputMintUiAddress,
    outputMint: outputMintUiAddress,
    amountUi: inputAmountUi
  } = params

  if (
    !solWalletAddress ||
    !inputMintUiAddress ||
    !outputMintUiAddress ||
    inputAmountUi === undefined
  ) {
    return
  }

  const isInputWAudio = inputMintUiAddress === TOKEN_LISTING_MAP.AUDIO.address
  const isOutputWAudio = outputMintUiAddress === TOKEN_LISTING_MAP.AUDIO.address

  if (!isInputWAudio && !isOutputWAudio) {
    return // Not a wAUDIO swap
  }

  if (isInputWAudio) {
    optimisticallyUpdateWalletAudioBalance(
      queryClient,
      solWalletAddress,
      Chain.Sol,
      AUDIO(wAUDIO(0 - inputAmountUi)).value
    )
  } else if (isOutputWAudio && estimatedOutputAmount !== undefined) {
    optimisticallyUpdateWalletAudioBalance(
      queryClient,
      solWalletAddress,
      Chain.Sol,
      AUDIO(wAUDIO(estimatedOutputAmount)).value
    )
  }
}

/**
 * Updates token balances in the cache optimistically based on Jupiter swap parameters.
 * Updates both input and output token balances immediately after transaction is sent.
 * Skips USDC tokens since they have their own balance management.
 *
 * @param queryClient - The query client to update
 * @param params - The swap parameters containing the input and output tokens and amounts
 * @param estimatedOutputAmount - The estimated output amount from the quote
 * @param ethAddress - The user's Ethereum wallet address
 * @param inputTokenDecimals - Number of decimals for the input token
 * @param outputTokenDecimals - Number of decimals for the output token
 * @param usdcMintAddress - The USDC mint address to skip optimistic updates for
 */
export const updateTokenBalancesOptimistically = (
  queryClient: QueryClient,
  params: SwapTokensParams,
  estimatedOutputAmount: number | undefined,
  ethAddress: string,
  inputTokenDecimals: number,
  outputTokenDecimals: number,
  usdcMintAddress: string
) => {
  const {
    inputMint: inputMintUiAddress,
    outputMint: outputMintUiAddress,
    amountUi: inputAmountUi
  } = params

  if (
    !ethAddress ||
    !inputMintUiAddress ||
    !outputMintUiAddress ||
    inputAmountUi === undefined
  ) {
    return
  }

  // Update input token balance (decrease) - only if not USDC
  if (inputMintUiAddress !== usdcMintAddress) {
    const inputQueryKey = getTokenBalanceQueryKey(
      ethAddress,
      inputMintUiAddress
    )
    queryClient.setQueryData(
      inputQueryKey,
      (
        oldData: TokenBalanceQueryData | undefined
      ): TokenBalanceQueryData | undefined => {
        if (!oldData?.balance) return oldData

        const currentBalance = oldData.balance
        const decreaseAmount = new FixedDecimal(
          inputAmountUi,
          inputTokenDecimals
        )
        const newBalanceValue = currentBalance.value - decreaseAmount.value

        return {
          ...oldData,
          balance: new FixedDecimal(newBalanceValue, inputTokenDecimals)
        }
      }
    )
  }

  // Update output token balance (increase) - only if not USDC
  if (
    estimatedOutputAmount !== undefined &&
    outputMintUiAddress !== usdcMintAddress
  ) {
    const outputQueryKey = getTokenBalanceQueryKey(
      ethAddress,
      outputMintUiAddress
    )
    queryClient.setQueryData(
      outputQueryKey,
      (
        oldData: TokenBalanceQueryData | undefined
      ): TokenBalanceQueryData | undefined => {
        if (!oldData) {
          // Create new balance data if none exists
          return {
            balance: new FixedDecimal(
              estimatedOutputAmount,
              outputTokenDecimals
            ),
            decimals: outputTokenDecimals
          }
        }

        const currentBalance = oldData.balance
        const increaseAmount = new FixedDecimal(
          estimatedOutputAmount,
          outputTokenDecimals
        )
        const newBalanceValue = currentBalance.value + increaseAmount.value

        return {
          ...oldData,
          balance: new FixedDecimal(newBalanceValue, outputTokenDecimals)
        }
      }
    )
  }
}
