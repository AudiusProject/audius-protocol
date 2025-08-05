import { AUDIO, wAUDIO } from '@audius/fixed-decimal'
import { QueryClient } from '@tanstack/react-query'

import { Chain } from '~/models'
import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'

import { optimisticallyUpdateWalletAudioBalance } from '../wallets/useAudioBalance'

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
