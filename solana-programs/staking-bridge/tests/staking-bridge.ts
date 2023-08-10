import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { StakingBridge } from '../target/types/staking_bridge'
import { CHAIN_ID_ETH, CONTRACTS } from '@certusone/wormhole-sdk'
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getOrCreateAssociatedTokenAccount
} from '@solana/spl-token'
import pkg from 'bs58'

const {
  Connection,
  Transaction,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} = anchor.web3

// Read in fee payer from the environment variable
const FEE_PAYER_SECRET = process.env.feePayerSecret
const feePayerSecret = pkg.decode(FEE_PAYER_SECRET)
const feePayerKeypair = Keypair.fromSecretKey(feePayerSecret)
const feePayerPublicKey = feePayerKeypair.publicKey

// Wormhole Testnet: Note that it uses Solana Devnet
// https://book.wormhole.com/reference/contracts.html#testnet
const CODE_BRIDGE_ID = CONTRACTS.TESTNET.solana.core
const bridgeId = new PublicKey(CODE_BRIDGE_ID)
const TOKEN_BRIDGE_ID = CONTRACTS.TESTNET.solana.token_bridge
const tokenBridgeId = new PublicKey(TOKEN_BRIDGE_ID)

// Solana Devnet
const ETH_TOKEN_ADDRESS = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6' // ETH Goerli
const SOL_TOKEN_MINT = '7VPWjBhCXrpYYBiRKZh1ubh9tLZZNkZGp2ReRphEV4Mc' // Wrapped Goerli ETH on Solana
const SOL_TOKEN_MINT_KEY = new PublicKey(SOL_TOKEN_MINT)

const endpoint = 'https://api.devnet.solana.com'
const connection = new Connection(endpoint, 'confirmed');

type PostMessageData = {
  nonce: anchor.BN,
  amount: anchor.BN,
  fee: anchor.BN,
  targetAddress: Buffer,
  targetChain: anchor.BN,
}

// Remove the 0x prefix and pad to 32 bytes
function formatEthAddress(address: string) {
  return address.slice(2).padStart(64, '0')
}

function getPostMessageData(args: { recipientEthAddress: string, amount: number, solTokenDecimals: number }): PostMessageData {
  return {
    nonce: new anchor.BN(0),
    amount: new anchor.BN(args.amount * 10 ** args.solTokenDecimals),
    fee: new anchor.BN(0),
    targetAddress: Buffer.from(formatEthAddress(args.recipientEthAddress)),
    targetChain: new anchor.BN(CHAIN_ID_ETH)
  }
}

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
  const provider = new anchor.AnchorProvider(connection, wallet, { skipPreflight: true });
  anchor.setProvider(provider)

  const program = anchor.workspace.StakingBridge as Program<StakingBridge>;

  const [stakingBridgePda, stakingBridgePdaBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('staking_bridge')],
    program.programId
  );

  it('creates the staking bridge pda', async () => {
    // Add your test here.
    const tx = await program.methods
      .createPda()
      .accounts({
        stakingBridgePda,
        payer: feePayerPublicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log('Your transaction signature', tx);
  });

  it('posts the wormhole token bridge transfer message', async () => {
    const messageKeypair = Keypair.generate()
    const messagePublicKey = messageKeypair.publicKey

    // Use your own Goerli ETH address to receive the tokens
    const recipientEthAddress = '0x9d959Cf57D89DCf41925e19479A04E26f27563dB'
    const solTokenDecimals = 8

    const {
      nonce,
      amount,
      fee,
      targetAddress,
      targetChain
    } = getPostMessageData({
      recipientEthAddress,
      amount: 1,
      solTokenDecimals
    })

    const tokenAddress = Buffer.from(formatEthAddress(ETH_TOKEN_ADDRESS))
    const tokenChain = new anchor.BN(CHAIN_ID_ETH)

    // Associated token account owned by the PDA
    const pdaAta = await getOrCreateAssociatedTokenAccount(
      connection,
      feePayerKeypair,
      SOL_TOKEN_MINT_KEY,
      stakingBridgePda,
      true // allowOwnerOffCurve: we need this since the owner is a program
    )
    const pdaAtaKey = pdaAta.address
    console.log({ pdaAtaKey })

    // Create the PDA associated token account if it doesn't exist
    createAssociatedTokenAccountIfNotExists({
      mintKey: SOL_TOKEN_MINT_KEY,
      ownerKey: stakingBridgePda,
      ataKey: pdaAtaKey,
      feePayerKeypair
    })

    // PDAs
    const [config, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      tokenBridgeId
    )
    const [wrappedMint, wrappedMintBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('wrapped'),
        tokenChain.toArrayLike(Buffer, 'be', 2),
        tokenAddress
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
      .postMessage(
        nonce,
        amount,
        fee,
        targetAddress,
        targetChain,
        tokenAddress,
        tokenChain,
        ...bumps
      )
      .accounts(accounts)
      .signers(signers)
      .rpc();
    console.log('Your transaction signature', tx);
  });
});
