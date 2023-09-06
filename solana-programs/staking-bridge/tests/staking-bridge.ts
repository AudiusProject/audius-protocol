import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { StakingBridge } from '../target/types/staking_bridge'
import { CHAIN_ID_ETH } from '@certusone/wormhole-sdk'
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import {
  ETH_AUDIO_TOKEN_ADDRESS,
  SOL_AUDIO_DECIMALS,
  SOL_AUDIO_TOKEN_ADDRESS,
  SOL_USDC_DECIMALS,
  SOL_USDC_TOKEN_ADDRESS,
  ammProgram,
  bridgeId,
  serumDexProgram,
  serumMarketPublicKey,
  tokenBridgeId
} from './constants'
import { getAssociatedPoolKeys, getMarket, getVaultOwnerAndNonce } from './raydiumTestUtils'
import { formatEthAddress, getPostMessageData } from './wormholeTestUtils'
import { assert } from 'chai'

const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} = anchor.web3

// Read in fee payer from the environment variable
const FEE_PAYER_SECRET = process.env.feePayerSecret
const feePayerKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(FEE_PAYER_SECRET))
)
const feePayerPublicKey = feePayerKeypair.publicKey

const SOL_USDC_TOKEN_ADDRESS_KEY = new PublicKey(SOL_USDC_TOKEN_ADDRESS)
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

describe('staking-bridge', () => {
  const wallet = {
    publicKey: feePayerPublicKey,
    signTransaction,
    signAllTransactions
  }
  const provider = new anchor.AnchorProvider(connection, wallet, { skipPreflight: true })
  anchor.setProvider(provider)

  const program = anchor.workspace.StakingBridge as Program<StakingBridge>

  const [stakingBridgePda, stakingBridgePdaBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('staking_bridge')],
    program.programId
  )

  it('creates the staking bridge balance pda', async () => {
    try {
      const tx = await program.methods
        .createStakingBridgeBalancePda()
        .accounts({
          stakingBridgePda,
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
      console.log('Staking Bridge balance PDA already exists')
    }

    const stakingBridgePdaAccount = await connection.getAccountInfo(stakingBridgePda)
    assert.ok(stakingBridgePdaAccount, 'Staking Bridge balance PDA account not found')
  })

  it('creates the staking bridge balance usdc and audio associated token accounts', async () => {
    const usdcTokenAccount = getAssociatedTokenAddressSync(
      SOL_USDC_TOKEN_ADDRESS_KEY,
      stakingBridgePda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    const audioTokenAccount = getAssociatedTokenAddressSync(
      SOL_AUDIO_TOKEN_ADDRESS_KEY,
      stakingBridgePda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )

    try {
      const tx = await program.methods
        .createStakingBridgeBalanceAtas(stakingBridgePdaBump)
        .accounts({
          stakingBridgePda,
          usdcTokenAccount,
          usdcMint: SOL_USDC_TOKEN_ADDRESS_KEY,
          audioTokenAccount,
          audioMint: SOL_AUDIO_TOKEN_ADDRESS_KEY,
          payer: feePayerPublicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([feePayerKeypair])
        .rpc()
      console.log('Your transaction signature', tx)
    } catch (e) {
      const timeoutError = 'TransactionExpiredTimeoutError'
      if (e.toString().includes(timeoutError)) {
        assert.fail(`The transaction timed out, but the ATAs may have been created.\nError: ${e}`)
      }
    }

    const usdcAtaAccount = await connection.getAccountInfo(usdcTokenAccount)
    assert.ok(usdcAtaAccount, 'Staking Bridge USDC ATA account not found')
    const audioAtaAccount = await connection.getAccountInfo(audioTokenAccount)
    assert.ok(audioAtaAccount, 'Staking Bridge AUDIO ATA account not found')
  })

  it('swaps SOL USDC to SOL AUDIO', async () => {
    const market = await getMarket(connection, serumMarketPublicKey.toString(), serumDexProgram.toString())

    const poolKeys = await getAssociatedPoolKeys({
      programId: ammProgram,
      serumProgramId: serumDexProgram,
      marketId: market.address,
      baseMint: market.baseMint,
      quoteMint: market.quoteMint
    })

    const { vaultOwner, vaultNonce } = await getVaultOwnerAndNonce(serumMarketPublicKey, serumDexProgram)
    assert.equal(
      vaultNonce.toNumber(),
      market.vaultSignerNonce,
      'vaultSignerNonce is incorrect'
    )

    // Get associated token accounts for the staking bridge PDA.
    let usdcTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SOL_USDC_TOKEN_ADDRESS_KEY,
      stakingBridgePda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    const usdcAmountBeforeSwap = Number(usdcTokenAccount.amount)
    let audioTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SOL_AUDIO_TOKEN_ADDRESS_KEY,
      stakingBridgePda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    const audioAmountBeforeSwap = Number(audioTokenAccount.amount)

    // Amount of SOL USDC to be swapped for a minimum amount of SOL AUDIO expected to be received from the swap.
    const uiAmountIn = 0.00001
    const amountToSwap = uiAmountIn * 10 ** SOL_USDC_DECIMALS
    const amountIn = new anchor.BN(amountToSwap)
    const minimumAmountOut = new anchor.BN(0)

    const accounts = {
      programId: poolKeys.programId,
      amm: poolKeys.id,
      ammAuthority: poolKeys.authority,
      ammOpenOrders: poolKeys.openOrders,
      ammTargetOrders: poolKeys.targetOrders,
      poolCoinTokenAccount: poolKeys.baseVault,
      poolPcTokenAccount: poolKeys.quoteVault,
      serumProgram: serumDexProgram,
      serumMarket: serumMarketPublicKey,
      serumBids: market.bids,
      serumAsks: market.asks,
      serumEventQueue: market.eventQueue,
      serumCoinVaultAccount: market.baseVault,
      serumPcVaultAccount: market.quoteVault,
      serumVaultSigner: vaultOwner,
      userSourceTokenAccount: usdcTokenAccount.address,
      userDestinationTokenAccount: audioTokenAccount.address,
      userSourceOwner: stakingBridgePda,
      usdcMint: SOL_USDC_TOKEN_ADDRESS_KEY,
      audioMint: SOL_AUDIO_TOKEN_ADDRESS_KEY,
      splTokenProgram: TOKEN_PROGRAM_ID,
    }

    const tx = await program.methods
      .raydiumSwap(
        amountIn,
        minimumAmountOut,
        vaultNonce,
        stakingBridgePdaBump,
      )
      .accounts(accounts)
      .rpc()
    console.log('Your transaction signature', tx)

    usdcTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SOL_USDC_TOKEN_ADDRESS_KEY,
      stakingBridgePda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    audioTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SOL_AUDIO_TOKEN_ADDRESS_KEY,
      stakingBridgePda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    assert.equal(
      Number(usdcTokenAccount.amount),
      usdcAmountBeforeSwap - amountToSwap,
      'Incorrect expected amount after raydium swap'
    )
    assert.isAbove(
      Number(audioTokenAccount.amount),
      audioAmountBeforeSwap,
      'AUDIO amount did not increase'
    )
  })

  it('posts the wormhole token bridge transfer message', async () => {
    const messageKeypair = Keypair.generate()
    const messagePublicKey = messageKeypair.publicKey

    // How many SOL AUDIO tokens to convert into ETH AUDIO tokens
    const uiAmount = 0.00001
    const { lastValidBlockHeight } = await connection.getLatestBlockhash()
    const {
      nonce,
      amount,
    } = getPostMessageData({
      uiAmount,
      solTokenDecimals: SOL_AUDIO_DECIMALS,
      lastValidBlockHeight
    })
    const amountToTransfer = amount.toNumber()

    // AUDIO associated token account owned by the PDA
    let audioTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SOL_AUDIO_TOKEN_ADDRESS_KEY,
      stakingBridgePda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    const pdaAtaKey = audioTokenAccount.address
    const audioAmountBeforeTransfer = Number(audioTokenAccount.amount)

    // PDAs
    const [config, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      tokenBridgeId
    )
    const [wrappedMint, wrappedMintBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('wrapped'),
        new anchor.BN(CHAIN_ID_ETH).toArrayLike(Buffer, 'be', 2),
        Buffer.from(formatEthAddress(ETH_AUDIO_TOKEN_ADDRESS), 'hex')
      ],
      tokenBridgeId
    )
    const [wrappedMeta, wrappedMetaBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('meta'),
        wrappedMint.toBuffer()
      ],
      tokenBridgeId
    )
    const [authoritySigner, authoritySignerBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority_signer')],
      tokenBridgeId
    )
    const [bridgeConfig, bridgeConfigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('Bridge')],
      bridgeId
    )
    const [emitter, emitterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('emitter')],
      tokenBridgeId
    )
    const [sequence, sequenceBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('Sequence'), emitter.toBuffer()],
      bridgeId
    )
    const [feeCollector, feeCollectorBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('fee_collector')],
      bridgeId
    )

    // Bumps array to pass into instruction
    const bumps = [
      configBump,
      wrappedMintBump,
      wrappedMetaBump,
      authoritySignerBump,
      bridgeConfigBump,
      emitterBump,
      sequenceBump,
      feeCollectorBump,
      stakingBridgePdaBump
    ]

    // Accounts
    const accounts = {
      programId: tokenBridgeId,
      bridgeId,
      payer: feePayerPublicKey,
      message: messagePublicKey,
      from: pdaAtaKey,
      fromOwner: stakingBridgePda,
      audioMint: SOL_AUDIO_TOKEN_ADDRESS_KEY,

      // bridge PDAs
      config,
      wrappedMint,
      wrappedMeta,
      authoritySigner,
      bridgeConfig,
      emitter,
      sequence,
      feeCollector,

      // system vars
      clock: SYSVAR_CLOCK_PUBKEY,
      rent: SYSVAR_RENT_PUBKEY,
      splToken: new PublicKey(TOKEN_PROGRAM_ID),
      systemProgram: SystemProgram.programId,
    }

    // Signers
    // fromOwner is also a signer but the program will use
    // invoke_signed() internally to sign it with the PDA
    const signers = [feePayerKeypair, messageKeypair]

    // Send the transaction
    const tx = await program.methods
      .postWormholeMessage(
        nonce,
        amount,
        ...bumps
      )
      .accounts(accounts)
      .signers(signers)
      .rpc()
    console.log('Your transaction signature', tx)

    audioTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SOL_AUDIO_TOKEN_ADDRESS_KEY,
      stakingBridgePda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    assert.equal(
      Number(audioTokenAccount.amount),
      audioAmountBeforeTransfer - amountToTransfer,
      'Incorrect expected amount after wormhole transfer'
    )
  })
})
