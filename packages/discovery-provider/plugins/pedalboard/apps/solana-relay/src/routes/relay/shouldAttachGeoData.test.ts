import { PaymentRouterProgram } from '@audius/spl'
import {
  Keypair,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js'
import { config } from '../../config'
import { describe, it } from 'vitest'
import { shouldAttachGeoData } from './shouldAttachGeoData'
import assert from 'assert'

const PAYMENT_ROUTER_PROGRAM_ID = new PublicKey(config.paymentRouterProgramId)
const MEMO_V2_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
)

const getRandomPublicKey = () => Keypair.generate().publicKey

describe('Should Attach Geo Data', function () {
    it('Attach when instructions are a payment', async function () {
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
      const attach = await shouldAttachGeoData(instructions)
      assert.strictEqual(attach, true)
    })

    it('Should not attach for recovery', async function () {
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
      const attach = await shouldAttachGeoData(instructions)
      assert.strictEqual(attach, false)
    })
})
