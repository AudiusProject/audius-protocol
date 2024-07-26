import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Crowdfund } from '../target/types/crowdfund'

const { Connection, Keypair, PublicKey, SystemProgram } = anchor.web3

describe('crowdfund', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace.Crowdfund as Program<Crowdfund>

  it('Is initialized!', async () => {
    let destination_wallet = PublicKey.unique()

    // const FEE_PAYER_SECRET = process.env.feePayerSecret
    const FEE_PAYER_SECRET = process.env.feePayerSecret
    const feePayerKeypair = Keypair.fromSecretKey(
      // DO NOT COMMIT
      Uint8Array.from([
        24, 169, 89, 193, 128, 85, 185, 236, 100, 125, 75, 197, 49, 45, 121, 41,
        42, 24, 158, 170, 244, 42, 121, 202, 166, 166, 171, 19, 170, 155, 236,
        198, 21, 45, 187, 102, 29, 18, 148, 10, 82, 210, 110, 169, 136, 72, 242,
        23, 181, 126, 99, 201, 213, 39, 52, 131, 215, 141, 191, 245, 123, 168,
        194, 75
      ])
      // Uint8Array.from(JSON.parse(FEE_PAYER_SECRET))
    )

    const tx = await program.methods
      .startCampaign(new anchor.BN(1000), 1, {
        destinationWallet: destination_wallet,
        fundingThreshold: new anchor.BN(1000),
        feePayerWallet: feePayerKeypair.publicKey
      })
      .accounts({
        feePayerWallet: feePayerKeypair.publicKey
      })
      .signers([feePayerKeypair])
      .rpc()
    console.log('Your transaction signature', tx)
  })
})
