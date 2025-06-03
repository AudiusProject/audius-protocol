import { AUDIO, AudioWei, wAUDIO } from '@audius/fixed-decimal'
import { QueryClient } from '@tanstack/react-query'
import BN from 'bn.js'

import { Chain } from '~/models'
import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'

import { getWalletAudioBalanceQueryKey } from '../wallets/useAudioBalance'

import { SwapTokensParams } from './types'

/**
 * Converts a UI-friendly number amount to wAudio AudioWei.
 */
const wAudioAmountToWei = (amount: number): AudioWei => {
  const scaledAmount = BigInt(
    Math.round(amount * 10 ** TOKEN_LISTING_MAP.AUDIO.decimals)
  )
  return AUDIO(wAUDIO(scaledAmount)).value
}

/**
 * Updates the wAUDIO balance for a Solana wallet in the cache.
 */
const updateSolanaWAudioBalance = ({
  queryClient,
  walletAddress,
  uiAmount,
  isInput
}: {
  queryClient: QueryClient
  walletAddress: string
  uiAmount: number
  isInput: boolean
}) => {
  queryClient.setQueryData(
    getWalletAudioBalanceQueryKey({
      address: walletAddress,
      chain: Chain.Sol,
      includeStaked: true
    }),
    (oldBalance: AudioWei | undefined): AudioWei | undefined => {
      const changeAmountBN = new BN(wAudioAmountToWei(uiAmount).toString())
      const oldBalanceBN = new BN((oldBalance ?? AUDIO(0).value).toString())

      let newBalanceBN: BN
      if (isInput) {
        // Decreasing balance
        if (oldBalanceBN.gt(changeAmountBN)) {
          newBalanceBN = oldBalanceBN.sub(changeAmountBN)
        } else {
          newBalanceBN = new BN(0)
        }
      } else {
        // Increasing balance
        newBalanceBN = oldBalanceBN.add(changeAmountBN)
      }
      return AUDIO(newBalanceBN).value
    }
  )
}

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
    updateSolanaWAudioBalance({
      queryClient,
      walletAddress: solWalletAddress,
      uiAmount: inputAmountUi,
      isInput: true
    })
  } else if (isOutputWAudio && estimatedOutputAmount !== undefined) {
    updateSolanaWAudioBalance({
      queryClient,
      walletAddress: solWalletAddress,
      uiAmount: estimatedOutputAmount,
      isInput: false
    })
  }
}
