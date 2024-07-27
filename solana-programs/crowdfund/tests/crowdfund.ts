import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Crowdfund } from '../target/types/crowdfund'
import {
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  mintTo
} from '@solana/spl-token'
import util from 'util'
import assert from 'assert'

const { LAMPORTS_PER_SOL } = anchor.web3

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
    const contentId = 123
    const contentType = 1

    // Create token mint
    const mint = await createMint(
      provider.connection,
      feePayer,
      feePayer.publicKey,
      null,
      9
    )

    let destinationWallet = anchor.web3.Keypair.generate()
    const destinationAta = getAssociatedTokenAddressSync(
      mint,
      destinationWallet.publicKey
    )
    await createAssociatedTokenAccount(
      provider.connection,
      feePayer,
      mint,
      destinationWallet.publicKey
    )

    // Create campaign
    const { pubkeys, signature } = await program.methods
      .startCampaign({
        contentId,
        contentType,
        destinationWallet: destinationAta,
        fundingThreshold: new anchor.BN('1000000')
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

    assert.equal(campaign.contentId, contentId)
    assert.equal(campaign.contentType, 1)

    // Mint tokens
    console.log('Create ATA...')
    const ata = getAssociatedTokenAddressSync(mint, feePayer.publicKey)
    await createAssociatedTokenAccount(
      provider.connection,
      feePayer,
      mint,
      feePayer.publicKey
    )
    console.log('Created ATA. Minting...')
    await mintTo(
      provider.connection,
      feePayer,
      mint,
      ata,
      feePayer,
      1_000_000_000
    )

    console.log('Minted. Contributing...')

    // Contribute to campaign
    const sig = await program.methods
      .contribute({
        contentId,
        contentType,
        amount: new anchor.BN('1000000000')
      })
      .accounts({
        senderOwner: feePayer.publicKey,
        senderTokenAccount: ata,
        mint
      })
      .signers([feePayer])
      .rpc()

    console.log('Sent contribution:', sig)

    const escrow = await getAccount(
      provider.connection,
      pubkeys.escrowTokenAccount
    )
    assert.equal(escrow.amount, BigInt('1000000'))

    // End campaign

    const endSig = await program.methods
      .unlock({
        contentId,
        contentType
      })
      .accounts({
        destinationAccount: destinationAta,
        feePayerWallet: feePayer.publicKey,
        mint
      })
      .rpc()

    const destination = await getAccount(provider.connection, destinationAta)
    assert.equal(destination.amount, BigInt('1000000'))

    // assert error is thrown
    await assert.rejects(
      program.account.campaignAccount.fetch(pubkeys.campaignAccount)
    )

    // TODO
  })
})
