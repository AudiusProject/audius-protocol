import { AUDIO, AudioWei, wAUDIO } from '@audius/fixed-decimal'
import { QueryClient } from '@tanstack/react-query'

import { Chain } from '~/models'
import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'

import { getWalletAudioBalanceQueryKey } from '../wallets/useAudioBalance'

import { SwapTokensParams } from './types'

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
      const changeAmountWei = AUDIO(wAUDIO(uiAmount)).value
      const oldBalanceWei = oldBalance ?? AUDIO(0).value

      let newBalanceWei: AudioWei
      if (isInput) {
        // Decreasing balance
        if (oldBalanceWei > changeAmountWei) {
          newBalanceWei = (oldBalanceWei - changeAmountWei) as AudioWei
        } else {
          newBalanceWei = AUDIO(0).value
        }
      } else {
        // Increasing balance
        newBalanceWei = (oldBalanceWei + changeAmountWei) as AudioWei
      }
      return newBalanceWei
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
