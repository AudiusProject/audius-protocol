import { PaymentRouterProgram } from '@audius/spl'
import {
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
} from '@solana/web3.js'
import { config } from '../../config'
import { describe, it } from 'vitest'
import { attachLocationData, isPaymentTransaction } from './attachLocationData'
import assert from 'assert'

const PAYMENT_ROUTER_PROGRAM_ID = new PublicKey(config.paymentRouterProgramId)
const MEMO_V2_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
)

const getRandomPublicKey = () => Keypair.generate().publicKey

describe('isPaymentTransaction', () => {
    it('returns true when instructions are a payment', async () => {
      const [pda, bump] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode('payment_router')],
        new PublicKey(PAYMENT_ROUTER_PROGRAM_ID)
      )
      const instructions = [
        await PaymentRouterProgram.createRouteInstruction({
          sender: getRandomPublicKey(),
          senderOwner: pda,
          paymentRouterPdaBump: bump,
          recipients: [getRandomPublicKey()],
          amounts: [BigInt(100)],
          totalAmount: BigInt(100),
          programId: PAYMENT_ROUTER_PROGRAM_ID
        })
      ]
      const isPayment = await isPaymentTransaction(instructions)
      assert.strictEqual(isPayment, true)
    })

    it('returns false whe instructions are a recovery', async () => {
      const [pda, bump] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode('payment_router')],
        new PublicKey(PAYMENT_ROUTER_PROGRAM_ID)
      )
      const instructions = [
        await PaymentRouterProgram.createRouteInstruction({
          sender: getRandomPublicKey(),
          senderOwner: pda,
          paymentRouterPdaBump: bump,
          recipients: [getRandomPublicKey()],
          amounts: [BigInt(100)],
          totalAmount: BigInt(100),
          programId: PAYMENT_ROUTER_PROGRAM_ID
        }),
        new TransactionInstruction({
          keys: [{ pubkey: getRandomPublicKey(), isSigner: true, isWritable: true }],
          data: Buffer.from('Recover Withdrawal'),
          programId: MEMO_V2_PROGRAM_ID
        })
      ]
      const isPayment = await isPaymentTransaction(instructions)
      assert.strictEqual(isPayment, false)
    })
})

describe('attachLocationData', () => {
  it('attaches a properly formatted geo instruction', async () => {
    const payerKey = getRandomPublicKey()
    const recentBlockhash = '5D1qXoiJqhYYJTyVCWijs9zX9n2AoZbcbLviHHZ1U14L'
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode('payment_router')],
      new PublicKey(PAYMENT_ROUTER_PROGRAM_ID)
    )
    const instructions = [
      await PaymentRouterProgram.createRouteInstruction({
        sender: getRandomPublicKey(),
        senderOwner: pda,
        paymentRouterPdaBump: bump,
        recipients: [getRandomPublicKey()],
        amounts: [BigInt(100)],
        totalAmount: BigInt(100),
        programId: PAYMENT_ROUTER_PROGRAM_ID
      }),
      new TransactionInstruction({
        keys: [{ pubkey: getRandomPublicKey(), isSigner: true, isWritable: true }],
        data: Buffer.from('Some random memo'),
        programId: MEMO_V2_PROGRAM_ID
      })
    ]
    const message = new TransactionMessage({
      payerKey,
      recentBlockhash,
      instructions
    })
    const updatedMessage = attachLocationData({
      transactionMessage: message,
      location: {city: 'Nashville', region: 'TN', country: 'United States'}
    })
    assert.strictEqual(updatedMessage.instructions.length, 3)

    assert.strictEqual(updatedMessage.instructions[0], instructions[0])
    assert.strictEqual(updatedMessage.instructions[1], instructions[1])

    assert.strictEqual(
      updatedMessage.instructions[2].data.toString(),
      'geo:{"city":"Nashville","region":"TN","country":"United States"}'
    )
  })
})
