import * as anchor from '@coral-xyz/anchor'

// Remove the 0x prefix and pad to 32 bytes
export function formatEthAddress(address: string) {
  return address.slice(2).padStart(64, '0')
}

export function getPostMessageData(args: { uiAmount: number, solTokenDecimals: number, lastValidBlockHeight: number }) {
  return {
    amount: new anchor.BN(args.uiAmount * 10 ** args.solTokenDecimals)
  }
}
