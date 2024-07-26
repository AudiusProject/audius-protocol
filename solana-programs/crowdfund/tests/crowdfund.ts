import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Crowdfund } from '../target/types/crowdfund'
import { createMint } from '@solana/spl-token'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import util from 'util'

const { Connection, Keypair, PublicKey } = anchor.web3

describe('crowdfund', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())
  const provider = anchor.getProvider()

  const program = anchor.workspace.Crowdfund as Program<Crowdfund>
  const feePayer = anchor.web3.Keypair.generate()

  before(async () => {
    console.log('Funding fee payer...')
    const signature = await provider.connection.requestAirdrop(
      feePayer.publicKey,
      10 * LAMPORTS_PER_SOL
    )

    const latestBlockHash = await provider.connection.getLatestBlockhash()
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature
    })
    console.log('Fee payer funded:', signature)
  })

  it('Creates a campaign', async () => {
    let destinationWallet = PublicKey.unique()

    const mint = await createMint(
      provider.connection,
      feePayer,
      feePayer.publicKey,
      null,
      9
    )
    const tx = await program.methods
      .startCampaign({
        contentId: 123,
        contentType: 1,
        destinationWallet,
        fundingThreshold: new anchor.BN(1000000),
        feePayerWallet: feePayer.publicKey
      })
      .accounts({
        feePayerWallet: feePayer.publicKey,
        mint: mint
      })
      .signers([feePayer])
      .rpc()
    console.log('Campaign started:', tx)

    const campaigns = await program.account.campaignAccount.all()
    console.log('Campaigns:', util.inspect(campaigns, false, 10, true))
  })
})
