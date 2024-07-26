import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Crowdfund } from '../target/types/crowdfund'
import {
  createAssociatedTokenAccount,
  createMint,
  getAssociatedTokenAddressSync,
  mintTo
} from '@solana/spl-token'
import util from 'util'
import assert from 'assert'

const { PublicKey, LAMPORTS_PER_SOL } = anchor.web3

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

    // Create token mint
    const mint = await createMint(
      provider.connection,
      feePayer,
      feePayer.publicKey,
      null,
      9
    )

    // Create campaign
    const { pubkeys, signature } = await program.methods
      .startCampaign({
        contentId: 123,
        contentType: 1,
        destinationWallet,
        fundingThreshold: new anchor.BN(1000000)
      })
      .accounts({
        feePayerWallet: feePayer.publicKey,
        mint: mint
      })
      .signers([feePayer])
      .rpcAndKeys()

    console.log('Campaign started:', signature)

    const campaign = await program.account.campaignAccount.fetch(
      pubkeys.campaignAccount
    )
    console.log('Campaign:', util.inspect(campaign, false, 10, true))

    assert.equal(campaign.contentId, 123)
    assert.equal(Object.keys(campaign.contentType)[0], 'track')

    // Mint tokens
    const ata = getAssociatedTokenAddressSync(mint, feePayer.publicKey)
    await createAssociatedTokenAccount(
      provider.connection,
      feePayer,
      mint,
      feePayer.publicKey
    )
    await mintTo(provider.connection, feePayer, mint, ata, feePayer, 1)

    // Contribute to campaign
    // TODO

    // End campaign
    // TODO
  })
})
