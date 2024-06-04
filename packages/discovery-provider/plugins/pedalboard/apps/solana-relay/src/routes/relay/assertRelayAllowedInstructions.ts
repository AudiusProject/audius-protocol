import {
  decodeAssociatedTokenAccountInstruction,
  ClaimableTokensProgram,
  RewardManagerProgram,
  isCreateAssociatedTokenAccountIdempotentInstruction,
  isCreateAssociatedTokenAccountInstruction,
  Secp256k1Program
} from '@audius/spl'
import { Users } from '@pedalboard/storage'
import {
  NATIVE_MINT,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  decodeInstruction,
  isCloseAccountInstruction,
  isTransferCheckedInstruction,
  isSyncNativeInstruction,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SystemInstruction,
  ComputeBudgetProgram
} from '@solana/web3.js'
import bs58 from 'bs58'

import { config } from '../../config'
import { rateLimitTokenAccountCreation } from '../../redis'

import { InvalidRelayInstructionError } from './InvalidRelayInstructionError'

const MEMO_PROGRAM_ID = 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'
const MEMO_V2_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
const CLAIMABLE_TOKEN_PROGRAM_ID = config.claimableTokenProgramId
const REWARDS_MANAGER_PROGRAM_ID = config.rewardsManagerProgramId
const TRACK_LISTEN_COUNT_PROGRAM_ID = config.trackListenCountProgramId
const PAYMENT_ROUTER_PROGRAM_ID = config.paymentRouterProgramId
const JUPITER_AGGREGATOR_V6_PROGRAM_ID =
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'

const waudioMintAddress = config.waudioMintAddress
const usdcMintAddress = config.usdcMintAddress

const REWARD_MANAGER = config.rewardsManagerAccountAddress

const deriveTokenAuthority = (mint: string) =>
  PublicKey.findProgramAddressSync(
    [new PublicKey(mint).toBytes().slice(0, 32)],
    new PublicKey(CLAIMABLE_TOKEN_PROGRAM_ID)
  )[0]

const claimableTokenAuthorities = {
  usdc: deriveTokenAuthority(usdcMintAddress),
  waudio: deriveTokenAuthority(waudioMintAddress)
}

const deriveUserBank = async (
  ethAddress: string,
  claimableTokenAuthority: PublicKey
) => {
  const ethAddressArray = Uint8Array.from(
    Buffer.from(ethAddress.substring(2), 'hex')
  )
  return await PublicKey.createWithSeed(
    claimableTokenAuthority,
    bs58.encode(ethAddressArray),
    TOKEN_PROGRAM_ID
  )
}

const PAYMENT_ROUTER_WALLET = PublicKey.findProgramAddressSync(
  [Buffer.from('payment_router')],
  new PublicKey(PAYMENT_ROUTER_PROGRAM_ID)
)[0]

const PAYMENT_ROUTER_USDC_TOKEN_ACCOUNT = getAssociatedTokenAddressSync(
  new PublicKey(usdcMintAddress),
  PAYMENT_ROUTER_WALLET,
  true
)

/**
 * Only allow the createTokenAccount instruction of the Associated Token
 * Account program, provided it has matching close instructions.
 * Close instructions are on the Token Programand are not validated here.
 */
const assertAllowedAssociatedTokenAccountProgramInstruction = async (
  instructionIndex: number,
  instruction: TransactionInstruction,
  instructions: TransactionInstruction[],
  wallet?: string | null
) => {
  const decodedInstruction =
    decodeAssociatedTokenAccountInstruction(instruction)
  if (
    isCreateAssociatedTokenAccountInstruction(decodedInstruction) ||
    isCreateAssociatedTokenAccountIdempotentInstruction(decodedInstruction)
  ) {
    const allowedMints = [NATIVE_MINT.toBase58(), usdcMintAddress]
    const mintAddress = decodedInstruction.keys.mint.pubkey.toBase58()
    if (!allowedMints.includes(mintAddress)) {
      throw new InvalidRelayInstructionError(
        instructionIndex,
        `Mint not allowed for Associated Token Account program: ${mintAddress}`
      )
    }

    // Allow creating associated tokens for the Payment Router
    if (
      decodedInstruction.keys.owner.pubkey.toBase58() ===
      PAYMENT_ROUTER_WALLET.toBase58()
    ) {
      return
    }

    // Protect against feePayer drain by ensuring that there's always as
    // many account close instructions as creates
    const matchingCreateInstructions = instructions
      .filter((instr) => instr.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID))
      .map(decodeAssociatedTokenAccountInstruction)
      .filter(
        (instr) =>
          (isCreateAssociatedTokenAccountInstruction(instr) ||
            isCreateAssociatedTokenAccountIdempotentInstruction(instr)) &&
          decodedInstruction.keys.associatedToken.pubkey.equals(
            instr.keys.associatedToken.pubkey
          ) &&
          decodedInstruction.keys.payer.pubkey.equals(instr.keys.payer.pubkey)
      )
    const matchingCloseInstructions = instructions
      .filter((instr) => instr.programId.equals(TOKEN_PROGRAM_ID))
      .map((instr) => decodeInstruction(instr))
      .filter(
        (instr) =>
          isCloseAccountInstruction(instr) &&
          decodedInstruction.keys.associatedToken.pubkey.equals(
            instr.keys.account.pubkey
          ) &&
          decodedInstruction.keys.payer.pubkey.equals(
            instr.keys.destination.pubkey
          )
      )
    if (wallet) {
      try {
        await rateLimitTokenAccountCreation(wallet)
      } catch (e) {
        const error = e as Error
        throw new InvalidRelayInstructionError(instructionIndex, error.message)
      }
    } else if (
      matchingCreateInstructions.length !== matchingCloseInstructions.length
    ) {
      throw new InvalidRelayInstructionError(
        instructionIndex,
        `Mismatched number of create and close instructions for account: ${decodedInstruction.keys.associatedToken.pubkey.toBase58()}`
      )
    }
  } else {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      'Unsupported Associated Token Program instruction'
    )
  }
}

/**
 * Allow normal transfers provided they are into userbanks, and allow
 * close account instructions and sync native (to unwrap wSOL) instructions.
 */
const assertAllowedTokenProgramInstruction = async (
  instructionIndex: number,
  instruction: TransactionInstruction,
  wallet?: string | null
) => {
  const decodedInstruction = decodeInstruction(instruction)
  if (isTransferCheckedInstruction(decodedInstruction)) {
    if (!wallet) {
      throw new InvalidRelayInstructionError(
        instructionIndex,
        `Transfer Checked requires authentication`
      )
    }
    const destination = decodedInstruction.keys.destination.pubkey
    const userbank = await deriveUserBank(
      wallet,
      claimableTokenAuthorities.usdc
    )

    // Check that destination is either a userbank or a payment router token account
    if (
      !destination.equals(userbank) &&
      !destination.equals(PAYMENT_ROUTER_USDC_TOKEN_ACCOUNT)
    ) {
      throw new InvalidRelayInstructionError(
        instructionIndex,
        `Invalid destination account: ${destination.toBase58()}`
      )
    }
  } else if (
    !isCloseAccountInstruction(decodedInstruction) &&
    !isSyncNativeInstruction(decodedInstruction)
  ) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      'Unsupported Token Program instruction'
    )
  }
}

/**
 * Checks that the Reward Manager account on the Reward Manager program
 * matches the one in use on our deployed program.
 */
const assertAllowedRewardsManagerProgramInstruction = (
  instructionIndex: number,
  instruction: TransactionInstruction
) => {
  const decodedInstruction = RewardManagerProgram.decodeInstruction(instruction)
  const rewardManager =
    decodedInstruction.keys.rewardManagerState.pubkey.toBase58()
  if (rewardManager !== REWARD_MANAGER) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      `Invalid Reward Manager Account: ${rewardManager}`
    )
  }
}

/**
 * Checks that the claimable token authority matches the one in use on our
 * deployed program. Optionally also check the user's social proof for transfers.
 */
const assertAllowedClaimableTokenProgramInstruction = async (
  instructionIndex: number,
  instruction: TransactionInstruction
) => {
  const decodedInstruction =
    ClaimableTokensProgram.decodeInstruction(instruction)
  const authority = decodedInstruction.keys.authority.pubkey
  if (
    !authority.equals(claimableTokenAuthorities.usdc) &&
    !authority.equals(claimableTokenAuthorities.waudio)
  ) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      `Invalid Claimable Token Authority: ${authority}`
    )
  }
}

/**
 * Indexes of various accounts in a Jupiter V6 sharedAccountsRoute instruction.
 * https://github.com/jup-ag/jupiter-cpi/blob/main/idl.json
 */
const JupiterSharedSwapAccountIndex = {
  TOKEN_PROGRAM: 0,
  PROGRAM_AUTHORITY: 1,
  USER_TRANSFER_AUTHORITY: 2,
  SOURCE_TOKEN_ACCOUNT: 3,
  PROGRAM_SOURCE_TOKEN_ACCOUNT: 4,
  PROGRAM_DESTINATION_TOKEN_ACCOUNT: 5,
  DESTINATION_TOKEN_ACCOUNT: 6,
  SOURCE_MINT: 7,
  DESTINATION_MINT: 8,
  PLATFORM_FEE_ACCOUNT: 9,
  TOKEN_2022_PROGRAM: 10
}
// Only allow swaps from USDC (for withdrawals) or SOL (for userbank purchases)
const allowedSourceMints = [NATIVE_MINT.toBase58(), usdcMintAddress]
const allowedDestinationMints = [
  NATIVE_MINT.toBase58(),
  usdcMintAddress,
  waudioMintAddress
]
// Only allow swaps to SOL (for withdrawals) or USDC or AUDIO (for userbank purchases)
const assertAllowedJupiterProgramInstruction = async (
  instructionIndex: number,
  instruction: TransactionInstruction,
  wallet?: string | null
) => {
  if (!wallet) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      'Jupiter Swap requires authentication'
    )
  }
  const sourceMint =
    instruction.keys[
      JupiterSharedSwapAccountIndex.SOURCE_MINT
    ].pubkey.toBase58()
  const destinationMint =
    instruction.keys[
      JupiterSharedSwapAccountIndex.DESTINATION_MINT
    ].pubkey.toBase58()
  const userWallet =
    instruction.keys[
      JupiterSharedSwapAccountIndex.USER_TRANSFER_AUTHORITY
    ].pubkey.toBase58()

  if (!allowedSourceMints.includes(sourceMint)) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      `Invalid source mint: ${sourceMint}`
    )
  }

  if (!allowedDestinationMints.includes(destinationMint)) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      `Invalid destination mint: ${destinationMint}`
    )
  }

  // Don't allow swaps on the feepayers
  const feePayerAddresses = config.solanaFeePayerWallets.map((kp) =>
    kp.publicKey.toBase58()
  )
  if (feePayerAddresses?.includes(userWallet)) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      `Invalid transfer authority: ${userWallet}`
    )
  }
}

const assertAllowedSystemProgramInstruction = (
  instructionIndex: number,
  instruction: TransactionInstruction,
  wallet?: string | null,
  feePayer?: string
) => {
  if (!wallet) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      'System program requires authentication'
    )
  }
  if (!feePayer) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      'Invalid fee payer'
    )
  }
  const decodedInstructionType =
    SystemInstruction.decodeInstructionType(instruction)
  if (decodedInstructionType !== 'Transfer') {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      'Invalid System Program Instruction'
    )
  } else {
    const decodedInstruction = SystemInstruction.decodeTransfer(instruction)
    if (decodedInstruction.fromPubkey.toBase58() === feePayer) {
      throw new InvalidRelayInstructionError(
        instructionIndex,
        'Invalid fromPubkey for transfer'
      )
    }
  }
}

const assertValidSecp256k1ProgramInstruction = (
  instructionIndex: number,
  instruction: TransactionInstruction
) => {
  try {
    if (
      !Secp256k1Program.verifySignature(Secp256k1Program.decode(instruction))
    ) {
      throw new Error('Signer does not match')
    }
  } catch (e) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      'Invalid Secp256k1Program instruction'
    )
  }
}

/**
 * Checks each of the instructions to make sure it's something we want to relay.
 * The main goals of the checks are to ensure the feePayer isn't abused.
 * Major checks include:
 * - Checking the caller is interacting with our deployed versions of the programs
 * - Checking the caller isn't creating token accounts that can be rent-drained
 * - Checking the caller isn't interacting with non-Audius related programs
 * @param instructions the instructions to check
 * @param user the user, if signed in
 * @param socialProofEnabled if social proof is enabled
 * @throws {InvalidRelayInstructionError} if the instruction isn't supported
 */
export const assertRelayAllowedInstructions = async (
  instructions: TransactionInstruction[],
  options?: {
    user?: Pick<Users, 'wallet'>
    feePayer?: string
  }
) => {
  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i]
    switch (instruction.programId.toBase58()) {
      case ASSOCIATED_TOKEN_PROGRAM_ID.toBase58():
        await assertAllowedAssociatedTokenAccountProgramInstruction(
          i,
          instruction,
          instructions,
          options?.user?.wallet
        )
        break
      case TOKEN_PROGRAM_ID.toBase58():
        await assertAllowedTokenProgramInstruction(
          i,
          instruction,
          options?.user?.wallet
        )
        break
      case REWARDS_MANAGER_PROGRAM_ID:
        assertAllowedRewardsManagerProgramInstruction(i, instruction)
        break
      case CLAIMABLE_TOKEN_PROGRAM_ID:
        await assertAllowedClaimableTokenProgramInstruction(i, instruction)
        break
      case JUPITER_AGGREGATOR_V6_PROGRAM_ID:
        await assertAllowedJupiterProgramInstruction(
          i,
          instruction,
          options?.user?.wallet
        )
        break
      case SystemProgram.programId.toBase58():
        assertAllowedSystemProgramInstruction(
          i,
          instruction,
          options?.user?.wallet,
          options?.feePayer
        )
        break
      case Secp256k1Program.programId.toBase58():
        assertValidSecp256k1ProgramInstruction(i, instruction)
        break
      case PAYMENT_ROUTER_PROGRAM_ID:
      case MEMO_PROGRAM_ID:
      case MEMO_V2_PROGRAM_ID:
      case TRACK_LISTEN_COUNT_PROGRAM_ID:
      case ComputeBudgetProgram.programId.toBase58():
        // All instructions of these programs are allowed
        break
      default:
        throw new InvalidRelayInstructionError(
          i,
          `Unknown Program: ${instruction.programId.toBase58()}`
        )
    }
  }
}
