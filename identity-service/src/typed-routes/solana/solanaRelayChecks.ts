import {
  NATIVE_MINT,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  decodeInstruction,
  isCloseAccountInstruction,
  isTransferCheckedInstruction
} from '@solana/spl-token'
import {
  PublicKey,
  TransactionInstruction,
  Secp256k1Program
} from '@solana/web3.js'
import audiusLibsWrapper from '../../audiusLibsInstance'
import models from '../../models'
import { InvalidRelayInstructionError } from './InvalidRelayInstructionError'
import {
  decodeAssociatedTokenAccountInstruction,
  isCreateAssociatedTokenAccountInstruction,
  isCreateAssociatedTokenAccountIdempotentInstruction
} from './instructions/associatedToken'
import {
  decodeClaimableTokenInstruction,
  isTransferClaimableTokenInstruction
} from './instructions/claimableToken'
import { decodeRewardManagerInstruction } from './instructions/rewardManager'
import config from '../../config'

const MEMO_PROGRAM_ID = 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'
const CLAIMABLE_TOKEN_PROGRAM_ID: string = config.get(
  'solanaClaimableTokenProgramAddress'
)
const REWARDS_MANAGER_PROGRAM_ID: string = config.get(
  'solanaRewardsManagerProgramId'
)
const JUPITER_AGGREGATOR_V6_PROGRAM_ID =
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'

const audioMintAddress: string = config.get('solanaMintAddress')
const usdcMintAddress: string = config.get('solanaUSDCMintAddress')

const REWARD_MANAGER: string = config.get('solanaRewardsManagerProgramPDA')

const claimableTokenAuthorities = [audioMintAddress, usdcMintAddress].reduce(
  (acc, mint) => ({
    ...acc,
    [mint]: PublicKey.findProgramAddressSync(
      [new PublicKey(usdcMintAddress).toBytes().slice(0, 32)],
      new PublicKey(CLAIMABLE_TOKEN_PROGRAM_ID)
    )[0]
  }),
  {} as Record<string, PublicKey>
)

const assertAllowedAssociatedTokenAccountProgramInstruction = (
  instructionIndex: number,
  instruction: TransactionInstruction,
  instructions: TransactionInstruction[]
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
    if (
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

const assertAllowedTokenProgramInstruction = async (
  instructionIndex: number,
  instruction: TransactionInstruction,
  wallet?: string
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
    const userbank = await (
      await audiusLibsWrapper.getAudiusLibsAsync()
    ).solanaWeb3Manager!.deriveUserBank({ ethAddress: wallet, mint: 'usdc' })
    if (!destination.equals(userbank)) {
      throw new InvalidRelayInstructionError(
        instructionIndex,
        `Invalid destination account: ${destination.toBase58()}`
      )
    }
  } else if (!isCloseAccountInstruction(decodedInstruction)) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      'Unsupported Token Program instruction'
    )
  }
}

const assertAllowedRewardsManagerProgramInstruction = (
  instructionIndex: number,
  instruction: TransactionInstruction
) => {
  const decodedInstruction = decodeRewardManagerInstruction(instruction)
  const rewardManager = decodedInstruction.keys.rewardManager.pubkey.toBase58()
  if (rewardManager !== REWARD_MANAGER) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      `Invalid Reward Manager Account: ${rewardManager}`
    )
  }
}

const assertAllowedClaimableTokenProgramInstruction = async (
  instructionIndex: number,
  instruction: TransactionInstruction,
  user?: { blockchainUserId: number; handle: string },
  socialProofEnabled = false
) => {
  const decodedInstruction = decodeClaimableTokenInstruction(instruction)
  const authority = decodedInstruction.keys.authority.pubkey
  if (
    !authority.equals(claimableTokenAuthorities[usdcMintAddress]) &&
    !authority.equals(claimableTokenAuthorities[audioMintAddress])
  ) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      `Invalid Claimable Token Authority: ${authority}`
    )
  }

  // Ensure user has social proof before withdrawing
  // TODO: Ensure this doesn't affect tipping
  if (
    socialProofEnabled &&
    isTransferClaimableTokenInstruction(decodedInstruction)
  ) {
    if (!user) {
      throw new InvalidRelayInstructionError(
        instructionIndex,
        'Claimable Token Transfer requires authentication'
      )
    }
    const { blockchainUserId } = user
    const twitterUser = await (models as unknown as any).TwitterUser.findOne({
      where: {
        blockchainUserId
      }
    })

    const instagramUser = await (
      models as unknown as any
    ).InstagramUser.findOne({
      where: {
        blockchainUserId
      }
    })
    const hasSocialProof = !!twitterUser || !!instagramUser
    if (!hasSocialProof) {
      throw new InvalidRelayInstructionError(
        instructionIndex,
        `User is missing social proof: ${user.handle}`
      )
    }
  }
}

/**
 * Indexes of various accounts in a Jupiter swap instruction.
 * Educated guesses only, based on experience.
 * Only the mints are used currently.
 */
const JupiterSwapAccountIndex = {
  USER_ACCOUNT: 2,
  USER_TOKEN_ACCOUNT: 3,
  TEMP_RECIPIENT_TOKEN_ACCOUNT: 4,
  TEMP_SENDER_TOKEN_ACCOUNT: 5,
  DESTINATION_TOKEN_ACCOUNT: 6,
  USER_TOKEN_MINT: 7,
  DESTINATION_TOKEN_MINT: 8
}
const assertAllowedJupiterProgramInstruction = (
  instructionIndex: number,
  instruction: TransactionInstruction,
  wallet?: string
) => {
  if (!wallet) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      'Jupiter Swap requires authentication'
    )
  }
  const sourceMint =
    instruction.keys[JupiterSwapAccountIndex.USER_TOKEN_MINT].pubkey.toBase58()
  const destinationMint =
    instruction.keys[
      JupiterSwapAccountIndex.DESTINATION_TOKEN_MINT
    ].pubkey.toBase58()
  if (sourceMint !== usdcMintAddress) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      `Invalid source mint: ${sourceMint}`
    )
  }
  if (destinationMint !== NATIVE_MINT.toBase58()) {
    throw new InvalidRelayInstructionError(
      instructionIndex,
      `Invalid destination mint: ${destinationMint}`
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
  user?: { walletAddress?: string; blockchainUserId: number; handle: string },
  socialProofEnabled = false
) => {
  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i]
    switch (instruction.programId.toBase58()) {
      case ASSOCIATED_TOKEN_PROGRAM_ID.toBase58():
        assertAllowedAssociatedTokenAccountProgramInstruction(
          i,
          instruction,
          instructions
        )
        break
      case TOKEN_PROGRAM_ID.toBase58():
        await assertAllowedTokenProgramInstruction(
          i,
          instruction,
          user?.walletAddress
        )
        break
      case REWARDS_MANAGER_PROGRAM_ID:
        assertAllowedRewardsManagerProgramInstruction(i, instruction)
        break
      case CLAIMABLE_TOKEN_PROGRAM_ID:
        await assertAllowedClaimableTokenProgramInstruction(
          i,
          instruction,
          user,
          socialProofEnabled
        )
        break
      case JUPITER_AGGREGATOR_V6_PROGRAM_ID:
        assertAllowedJupiterProgramInstruction(
          i,
          instruction,
          user?.walletAddress
        )
        break
      case Secp256k1Program.programId.toBase58():
      case MEMO_PROGRAM_ID:
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
