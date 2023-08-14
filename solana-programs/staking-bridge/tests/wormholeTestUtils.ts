import * as anchor from '@coral-xyz/anchor'
import { SOL_AUDIO_DECIMALS, SOL_USDC_DECIMALS } from './constants';

// Remove the 0x prefix and pad to 32 bytes
export function formatEthAddress(address: string) {
  return address.slice(2).padStart(64, '0')
}

export function getPostMessageData(args: { recipientEthAddress: string, wholeAmount: number, solTokenDecimals: number }) {
  return {
    nonce: new anchor.BN(0),
    amount: new anchor.BN(args.wholeAmount * 10 ** args.solTokenDecimals),
    fee: new anchor.BN(0)
  }
}

export function getMinimumAmountOutFromAmountIn(wholeAmountIn: number) {
  const amountIn = new anchor.BN(wholeAmountIn * 10 ** SOL_USDC_DECIMALS);
  // Get proper ratio, ideally automated programmatically (not manually)
  const ratio = 5 // On 2023/08/14, 1 SOL USDC ~= 5 SOL AUDIO
  const minimumAmountOut = wholeAmountIn * ratio * 10 ** SOL_AUDIO_DECIMALS
  return { amountIn, minimumAmountOut }
}
