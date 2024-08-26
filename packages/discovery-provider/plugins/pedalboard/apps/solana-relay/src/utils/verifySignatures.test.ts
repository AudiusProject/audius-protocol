import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { describe, it, expect } from 'vitest'

import { verifySignatures } from './verifySignatures'

describe('verifySignatures', () => {
  it('fails when signature is missing', () => {
    const toPubkey = PublicKey.unique()
    const fromPubkey = PublicKey.unique()
    const recentBlockhash = PublicKey.unique().toBase58()
    const transfer = SystemProgram.transfer({
      toPubkey,
      fromPubkey,
      lamports: 1
    })
    const message = new TransactionMessage({
      recentBlockhash,
      instructions: [transfer],
      payerKey: fromPubkey
    })
    const transaction = new VersionedTransaction(message.compileToV0Message())
    expect(verifySignatures(transaction)).toBe(false)
  })

  it('passes when signature is valid', () => {
    const toPubkey = PublicKey.unique()
    const payer = Keypair.generate()
    const fromPubkey = payer.publicKey
    const recentBlockhash = PublicKey.unique().toBase58()
    const transfer = SystemProgram.transfer({
      toPubkey,
      fromPubkey,
      lamports: 1
    })
    const message = new TransactionMessage({
      recentBlockhash,
      instructions: [transfer],
      payerKey: fromPubkey
    })
    const transaction = new VersionedTransaction(message.compileToV0Message())
    transaction.sign([payer])
    expect(verifySignatures(transaction)).toBe(true)
  })

  it('fails when the signature is invalid', () => {
    const toPubkey = PublicKey.unique()
    const payer = Keypair.generate()
    const fromPubkey = payer.publicKey
    const recentBlockhash = PublicKey.unique().toBase58()
    const transfer = SystemProgram.transfer({
      toPubkey,
      fromPubkey,
      lamports: 1
    })
    const message = new TransactionMessage({
      recentBlockhash,
      instructions: [transfer],
      payerKey: fromPubkey
    })
    const transaction = new VersionedTransaction(message.compileToV0Message())
    transaction.sign([payer])
    transaction.message.compiledInstructions[0].data[0] = -1
    expect(verifySignatures(transaction)).toBe(false)
  })
})
