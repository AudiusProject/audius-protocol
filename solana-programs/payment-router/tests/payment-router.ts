import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PaymentRouter } from '../target/types/payment_router'
import {
  SPL_AUDIO_DECIMALS,
  SPL_AUDIO_TOKEN_ADDRESS,
  SPL_USDC_DECIMALS,
  SPL_USDC_TOKEN_ADDRESS,
  MEMO_PROGRAM_ADDRESS
} from './constants'
import {
  TOKEN_PROGRAM_ID,
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount
} from '@solana/spl-token'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import { assert } from 'chai'
import { TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js'

const { Connection, Keypair, PublicKey, SystemProgram } = anchor.web3

// Read in fee payer from the environment variable
const FEE_PAYER_SECRET = process.env.feePayerSecret
const feePayerKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(FEE_PAYER_SECRET))
)
const feePayerPublicKey = feePayerKeypair.publicKey

const SPL_AUDIO_TOKEN_ADDRESS_KEY = new PublicKey(SPL_AUDIO_TOKEN_ADDRESS)
const SPL_USDC_TOKEN_ADDRESS_KEY = new PublicKey(SPL_USDC_TOKEN_ADDRESS)
const MEMO_PROGRAM_ADDRESS_KEY = new PublicKey(MEMO_PROGRAM_ADDRESS)

const endpoint = 'https://api.mainnet-beta.solana.com'
// Use this endpoint for local testing
// const endpoint = 'http://localhost:8899'
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
  const provider = new anchor.AnchorProvider(connection, wallet, {
    skipPreflight: true
  })
  anchor.setProvider(provider)

  const program = anchor.workspace.PaymentRouter as Program<PaymentRouter>

  const [paymentRouterPda, paymentRouterPdaBump] =
    PublicKey.findProgramAddressSync(
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
          systemProgram: SystemProgram.programId
        })
        .signers([feePayerKeypair])
        .rpc()
      console.log('Your transaction signature', tx)
    } catch (e) {
      const timeoutError = 'TransactionExpiredTimeoutError'
      if (e.toString().includes(timeoutError)) {
        assert.fail(
          `The transaction timed out, but the PDA may have been created.\nError: ${e}`
        )
      }
      const error = `{"err":{"InstructionError":[0,{"Custom":0}]}}`
      assert.ok(
        e.toString().includes(error),
        `Error message not expected: ${e.toString()}`
      )
      console.log('Payment Router balance PDA already exists')
    }
  })

  it('routes AUDIO amounts to the recipients', async () => {
    // List of 10 recipient testing $AUDIO token accounts.
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
      'CXeY4Yea4s78LDkXqwkvBmY65aMt4WTmeVeSaUgdz8Cf'
    ]
    const amount = 0.00001
    const recipientAmounts: Record<string, number> = recipients.reduce(
      (acc, recipient) => {
        acc[recipient] = amount
        return acc
      },
      {}
    )

    // Associated token account owned by the PDA
    let audioTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SPL_AUDIO_TOKEN_ADDRESS_KEY,
      paymentRouterPda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    const feePayerAudioTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SPL_AUDIO_TOKEN_ADDRESS_KEY,
      feePayerPublicKey
    )

    const pdaAtaKey = audioTokenAccount.address
    const audioAmountBeforeTransfer = Number(audioTokenAccount.amount)

    const amounts = Object.values(recipientAmounts).map(
      (amount) => new anchor.BN(amount * 10 ** SPL_AUDIO_DECIMALS)
    )
    const totalAmount = amounts.reduce(
      (a: anchor.BN, b: anchor.BN) => a.add(b),
      new anchor.BN(0)
    )

    const recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    const instructions = [
      createTransferCheckedInstruction(
        feePayerAudioTokenAccount.address,
        SPL_AUDIO_TOKEN_ADDRESS_KEY,
        pdaAtaKey,
        feePayerPublicKey,
        totalAmount.toNumber(),
        SPL_AUDIO_DECIMALS
      ),
      await program.methods
        .route(paymentRouterPdaBump, amounts, totalAmount)
        .accounts({
          sender: pdaAtaKey,
          senderOwner: paymentRouterPda,
          splToken: TOKEN_PROGRAM_ID
        })
        .remainingAccounts(
          recipients.map((recipient) => ({
            pubkey: new PublicKey(recipient),
            isSigner: false,
            isWritable: true
          }))
        )
        .instruction()
    ]
    const message = new TransactionMessage({
      payerKey: feePayerPublicKey,
      recentBlockhash,
      instructions
    }).compileToV0Message()
    const tx = new VersionedTransaction(message)
    tx.sign([feePayerKeypair])

    const rawTransaction = tx.serialize()
    await connection.sendRawTransaction(rawTransaction)
    console.log(
      'Your transaction signature',
      bs58.encode(tx.signatures[0])
    )

    audioTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SPL_AUDIO_TOKEN_ADDRESS_KEY,
      paymentRouterPda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    assert.equal(
      Number(audioTokenAccount.amount),
      audioAmountBeforeTransfer,
      'Incorrect expected amount after transfer to recipients'
    )
  })

  it('routes USDC amounts to the recipients', async () => {
    // List of 10 recipient testing $USDC token accounts.
    const recipients = [
      'C4DohgB7tKRrArNzofi5wkEaGWSWeifK4EruaWnA77D4',
      // 'FMcMbnqupTbWmmyWJb8DhX2f1DHyHEqFf1rD87fRupaP',
      // '4hbyJjqpWAbarjCQhY8YSeptZz1WYSS88DGqG4BteE3v',
      // 'C4DohgB7tKRrArNzofi5wkEaGWSWeifK4EruaWnA77D4',
      // 'isZMQA3Ury9FkZXBn4Gt51hTLxc8dYsQD7bWz4Ek46E',
      // 'DST1gMcKvrDrxmP4UhQkbJ8X6psL8WyuWnS3KWmqLRcu',
      // '3jnV4Xz7G6vLTNNScr86evmPdTSypP2uYGHtTzaHwGY2',
      // 'A6Txt94EB7vPkT5YVAqQbkKFfXpLggkEMYLRtQrzkM13',
      // '2kasfxzRdYq7GC96ZFRdvp31JAc8MREG21mxEVhEDzot',
      // '6mGfojkDcTHzhZ68pwDgntqn32EYYNDw7otZfT1GCQYH'
    ]
    const amount = 2
    const recipientAmounts: Record<string, number> = recipients.reduce(
      (acc, recipient) => {
        acc[recipient] = amount
        return acc
      },
      {}
    )

    // Associated token account owned by the PDA
    let usdcTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SPL_USDC_TOKEN_ADDRESS_KEY,
      paymentRouterPda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    const feePayerUsdcTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SPL_USDC_TOKEN_ADDRESS_KEY,
      feePayerPublicKey
    )

    const pdaAtaKey = usdcTokenAccount.address
    const usdcAmountBeforeTransfer = Number(usdcTokenAccount.amount)

    const amounts = Object.values(recipientAmounts).map(
      (amount) => new anchor.BN(amount * 10 ** SPL_USDC_DECIMALS)
    )
    const totalAmount = amounts.reduce(
      (a: anchor.BN, b: anchor.BN) => a.add(b),
      new anchor.BN(0)
    )
    console.log({totalAmount, s: totalAmount.toString()})

    const type = 'track'
    const id = 1666277701
    const blocknumber = 57655594
    const purchaserUserId = 5476
    const data = `${type}:${id}:${blocknumber}:${purchaserUserId}`
    const recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    const instructions = [
      createTransferCheckedInstruction(
        feePayerUsdcTokenAccount.address,
        SPL_USDC_TOKEN_ADDRESS_KEY,
        pdaAtaKey,
        feePayerPublicKey,
        totalAmount.toNumber(),
        SPL_USDC_DECIMALS
      ),
      new TransactionInstruction({
        keys: [{ pubkey: feePayerPublicKey, isSigner: true, isWritable: true }],
        data: Buffer.from(data),
        programId: MEMO_PROGRAM_ADDRESS_KEY
      }),
      await program.methods
        .route(paymentRouterPdaBump, amounts, totalAmount)
        .accounts({
          sender: pdaAtaKey,
          senderOwner: paymentRouterPda,
          splToken: TOKEN_PROGRAM_ID
        })
        .remainingAccounts(
          recipients.map((recipient) => ({
            pubkey: new PublicKey(recipient),
            isSigner: false,
            isWritable: true
          }))
        )
        .instruction()
    ]
    const message = new TransactionMessage({
      payerKey: feePayerPublicKey,
      recentBlockhash,
      instructions
    }).compileToV0Message()
    const tx = new VersionedTransaction(message)
    tx.sign([feePayerKeypair])

    const rawTransaction = tx.serialize()
    await connection.sendRawTransaction(rawTransaction)
    console.log(
      'Your transaction signature',
      bs58.encode(tx.signatures[0])
    )

    usdcTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SPL_USDC_TOKEN_ADDRESS_KEY,
      paymentRouterPda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    assert.equal(
      Number(usdcTokenAccount.amount),
      usdcAmountBeforeTransfer,
      'Incorrect expected amount after transfer to recipients'
    )
  })
})
