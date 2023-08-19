import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PaymentRouter } from '../target/types/payment_router'
import { recipientAmounts } from './utils'
import { SOL_AUDIO_DECIMALS, SOL_AUDIO_TOKEN_ADDRESS } from './constants'
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token'

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
const connection = new Connection(endpoint, 'confirmed')

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
  })

  it('routes the amounts to the recipients', async () => {
    // Associated token account owned by the PDA
    const pdaAta = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SOL_AUDIO_TOKEN_ADDRESS_KEY,
      paymentRouterPda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    const pdaAtaKey = pdaAta.address
    console.log({ pdaAtaKey })

    const amounts = Object.values(recipientAmounts).map(amount => new anchor.BN(amount * 10 ** SOL_AUDIO_DECIMALS))
    const totalAmount = amounts.reduce((a: anchor.BN, b: anchor.BN) => a.add(b), new anchor.BN(0))

    // Add your test here.
    const tx = await program.methods
      .route(
        paymentRouterPdaBump,
        ...amounts,
        totalAmount,
        true // isAudio
      )
      .accounts({
        sender: pdaAta.address,
        senderOwner: paymentRouterPda,
        splToken: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(
        Object.keys(recipientAmounts)
          .map(recipient => ({
            pubkey: new PublicKey(recipient),
            isSigner: false,
            isWritable: true
          }))
      )
      .rpc();
    console.log('Your transaction signature', tx);
  })
})
