import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PaymentRouter } from '../target/types/payment_router'
import { SOL_AUDIO_DECIMALS, SOL_AUDIO_TOKEN_ADDRESS } from './constants'
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token'
import { assert } from 'chai'

const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} = anchor.web3

// Read in fee payer from the environment variable
const FEE_PAYER_SECRET = process.env.feePayerSecret
const feePayerKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(FEE_PAYER_SECRET))
)
const feePayerPublicKey = feePayerKeypair.publicKey

const SOL_AUDIO_TOKEN_ADDRESS_KEY = new PublicKey(SOL_AUDIO_TOKEN_ADDRESS)

const endpoint = 'https://api.mainnet-beta.solana.com'
const connection = new Connection(endpoint, 'finalized')

async function signTransaction(transaction) {
  transaction.partialSign(feePayerKeypair)
  return transaction
}
async function signAllTransactions(transactions: any[]) {
  transactions.forEach((transaction) => {
    transaction.partialSign(feePayerKeypair)
  })
  return transactions
}

describe('payment-router', () => {
  const wallet = {
    publicKey: feePayerPublicKey,
    signTransaction,
    signAllTransactions
  }
  const provider = new anchor.AnchorProvider(connection, wallet, { skipPreflight: true })
  anchor.setProvider(provider)

  const program = anchor.workspace.PaymentRouter as Program<PaymentRouter>

  const [paymentRouterPda, paymentRouterPdaBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('payment_router')],
    program.programId
  )

  it('creates the payment router pda', async () => {
    try {
        const tx = await program.methods
        .createPaymentRouterBalancePda()
        .accounts({
          paymentRouterPda,
          payer: feePayerPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([feePayerKeypair])
        .rpc()
      console.log('Your transaction signature', tx)
    } catch (e) {
      const timeoutError = 'TransactionExpiredTimeoutError'
      if (e.toString().includes(timeoutError)) {
        assert.fail(`The transaction timed out, but the PDA may have been created.\nError: ${e}`)
      }
      const error = `{"err":{"InstructionError":[0,{"Custom":0}]}}`
      assert.ok(e.toString().includes(error), `Error message not expected: ${e.toString()}`)
      console.log('Payment Router balance PDA already exists')
    }
  })

  it('routes the amounts to the recipients', async () => {
    // List of 10 recipient token accounts.
    // The keys are some solana token accounts that can be used for testing.
    // https://explorer.solana.com/address/E7vtghUxo3DwBHHBnkYzTyKgtRS4cL8BiRyufdPMQYUp
    const recipients = [
      'E7vtghUxo3DwBHHBnkYzTyKgtRS4cL8BiRyufdPMQYUp',
      'FJ9KXGM6EtZ8fpmMZwHZsa8aL5kZvB3yS2HQzJC3ss5h',
      'FcJLAgj9YtNLfxBTyNP6ETZbu3A6cnzqQ32ZZssrPU68',
      '95dgkCLva8txDq3965nhqjc3jJP1RMhfjkLkapJF4Aue',
      '7n3okDUnWNfpQHFGhaGa3uMHjeWHvztj1ysoHyTGXhek',
      'BeQkbNGzHdEBBdaDNZHwGc3CNaATtHnJCg5zocCdQqNm',
      '6gY2Yy8cEFz74E1ZW4VmyLxDQDbPfM6S3iqbAbiZd15o',
      '98ASG9DEKBcojqeMN3KiqNvtmExMERq2uL5ZLUCRo1iq',
      'Aunpp6mQonYuKcmFPqhHsfRjrnF8MznHbVti2iVDp4MN',
      'CXeY4Yea4s78LDkXqwkvBmY65aMt4WTmeVeSaUgdz8Cf',
    ]
    const recipientAmounts: Record<string, number> = recipients
      .reduce((acc, recipient) => {
        acc[recipient] = 0.00001
        return acc
      },
      {}
    )

    // Associated token account owned by the PDA
    let audioTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SOL_AUDIO_TOKEN_ADDRESS_KEY,
      paymentRouterPda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    const pdaAtaKey = audioTokenAccount.address
    const audioAmountBeforeTransfer = Number(audioTokenAccount.amount)

    const amounts = Object.values(recipientAmounts)
      .map(amount => new anchor.BN(amount * 10 ** SOL_AUDIO_DECIMALS))
    const totalAmount = amounts
      .reduce((a: anchor.BN, b: anchor.BN) => a.add(b), new anchor.BN(0))

    const tx = await program.methods
      .route(
        paymentRouterPdaBump,
        amounts,
        totalAmount,
      )
      .accounts({
        sender: pdaAtaKey,
        senderOwner: paymentRouterPda,
        splToken: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(
        recipients
          .map(recipient => ({
            pubkey: new PublicKey(recipient),
            isSigner: false,
            isWritable: true
          }))
      )
      .rpc()
    console.log('Your transaction signature', tx)

    audioTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SOL_AUDIO_TOKEN_ADDRESS_KEY,
      paymentRouterPda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    assert.equal(
      Number(audioTokenAccount.amount),
      audioAmountBeforeTransfer - totalAmount.toNumber(),
      'Incorrect expected amount after transfer to recipients'
    )
  })
})
