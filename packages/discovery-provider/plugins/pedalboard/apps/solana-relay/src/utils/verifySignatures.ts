import { ed25519 } from '@noble/curves/ed25519'
import { VersionedTransaction } from '@solana/web3.js'

/**
 * Checks that the transaction is signed
 *
 * TODO PAY-3106: Verify the signature is correct as well as non-empty.
 * @see {@link https://github.com/solana-labs/solana-web3.js/blob/9344bbfa5dd68f3e15918ff606284373ae18911f/packages/library-legacy/src/transaction/legacy.ts#L767 verifySignatures} for Transaction in @solana/web3.js
 * @param transaction the versioned transaction to check
 * @returns false if missing a signature, true if all signatures are present.
 */
export const verifySignatures = (transaction: VersionedTransaction) => {
  for (let i = 0; i < transaction.message.header.numRequiredSignatures; i++) {
    const signature = transaction.signatures[i]
    const publicKey = transaction.message.staticAccountKeys[i].toBuffer()
    if (
      signature === undefined ||
      signature === null ||
      signature.every((b) => b === 0)
    ) {
      return false
    }
    const serialized = transaction.message.serialize()
    const valid = ed25519.verify(signature, serialized, publicKey)
    if (!valid) {
      return false
    }
  }
  return true
}
