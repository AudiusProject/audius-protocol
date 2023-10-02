import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createApproveInstruction,
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  createTransferCheckedInstruction
} from '@solana/spl-token'
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js'
import assert from 'assert'
import { assertRelayAllowedInstructions } from '../../src/typed-routes/solana/solanaRelayChecks'
import { InvalidRelayInstructionError } from '../../src/typed-routes/solana/InvalidRelayInstructionError'
import config from '../../src/config'
import { create } from 'lodash'
import audiusLibsWrapper from '../../src/audiusLibsInstance'
import {
  createClaimableTokenAccountInstruction,
  createTransferClaimableTokenInstruction
} from '../../src/typed-routes/solana/programs/claimable-tokens'

const CLAIMABLE_TOKEN_PROGRAM_ID = new PublicKey(
  config.get('solanaClaimableTokenProgramAddress')
)

const usdcMintKey = new PublicKey(config.get('solanaUSDCMintAddress'))
const audioMintKey = new PublicKey(config.get('solanaMintAddress'))

const usdcClaimableTokenAuthority = PublicKey.findProgramAddressSync(
  [usdcMintKey.toBytes().slice(0, 32)],
  CLAIMABLE_TOKEN_PROGRAM_ID
)[0]
const audioClaimableTokenAuthority = PublicKey.findProgramAddressSync(
  [audioMintKey.toBytes().slice(0, 32)],
  CLAIMABLE_TOKEN_PROGRAM_ID
)[0]

const getRandomPublicKey = () => Keypair.generate().publicKey

const assertThrows = async (
  fn: CallableFunction,
  errorType: Function,
  message = ''
) => {
  try {
    await fn()
    throw new Error()
  } catch (e) {
    assert(e instanceof errorType, `Expected failure for case: ${message}`)
  }
}

describe('Solana Relay', function () {
  describe('Associated Token Account Program Checks', function () {
    it('should allow create token account with matching close for valid mints', async function () {
      const payer = getRandomPublicKey()
      const associatedToken = getRandomPublicKey()
      const owner = getRandomPublicKey()

      // Basic case
      const instructions = [
        createAssociatedTokenAccountInstruction(
          payer,
          associatedToken,
          owner,
          usdcMintKey
        ),
        createCloseAccountInstruction(associatedToken, payer, owner)
      ]
      await assertRelayAllowedInstructions(instructions)

      // Allow out of order and mismatches as long as it all gets corrected
      const associatedToken2 = getRandomPublicKey()
      const payer2 = getRandomPublicKey()
      const complexInstructions = [
        createCloseAccountInstruction(associatedToken2, payer2, owner),
        createAssociatedTokenAccountInstruction(
          payer2,
          associatedToken2,
          owner,
          usdcMintKey
        ),
        createAssociatedTokenAccountInstruction(
          payer,
          associatedToken,
          owner,
          NATIVE_MINT
        ),
        createCloseAccountInstruction(associatedToken, payer, owner)
      ]
      await assertRelayAllowedInstructions(complexInstructions)
    })
    it('should not allow create token account without close', async function () {
      const payer = getRandomPublicKey()
      const associatedToken = getRandomPublicKey()
      const owner = getRandomPublicKey()

      // Ensure every associated token account create instruction has a close account instruction
      const missingCloseInstructions = [
        createAssociatedTokenAccountInstruction(
          payer,
          associatedToken,
          owner,
          usdcMintKey
        )
      ]
      await assertThrows(
        async () => assertRelayAllowedInstructions(missingCloseInstructions),
        InvalidRelayInstructionError,
        'Missing close instructions'
      )

      // Ensure the payer is refunded
      const unmatchedPayerInstructions = [
        createAssociatedTokenAccountInstruction(
          payer,
          associatedToken,
          owner,
          usdcMintKey
        ),
        createCloseAccountInstruction(
          associatedToken,
          getRandomPublicKey(),
          owner
        )
      ]
      await assertThrows(
        async () => assertRelayAllowedInstructions(unmatchedPayerInstructions),
        InvalidRelayInstructionError,
        'Mismatched account creation payer and close instruction destination'
      )

      // Ensure both instructions are for the same account
      const unmatchedAccountInstructions = [
        createAssociatedTokenAccountInstruction(
          payer,
          associatedToken,
          owner,
          usdcMintKey
        ),
        createCloseAccountInstruction(getRandomPublicKey(), payer, owner)
      ]
      await assertThrows(
        async () =>
          assertRelayAllowedInstructions(unmatchedAccountInstructions),
        InvalidRelayInstructionError,
        'Mismatched target token accounts'
      )
    })

    it('should not allow create token account with arbitrary mints', async function () {
      const payer = getRandomPublicKey()
      const associatedToken = getRandomPublicKey()
      const owner = getRandomPublicKey()
      const mint = getRandomPublicKey()
      const instructions = [
        createAssociatedTokenAccountInstruction(
          payer,
          associatedToken,
          owner,
          mint
        ),
        createCloseAccountInstruction(associatedToken, payer, owner)
      ]
      await assertThrows(
        async () => assertRelayAllowedInstructions(instructions),
        InvalidRelayInstructionError,
        'Mint not allowed'
      )
    })
  })

  describe('Token Program Checks', function () {
    it('should allow close instructions', async function () {
      const payer = getRandomPublicKey()
      const associatedToken = getRandomPublicKey()
      const owner = getRandomPublicKey()
      const instructions = [
        createCloseAccountInstruction(associatedToken, payer, owner)
      ]
      await assertRelayAllowedInstructions(instructions)
    })

    it('should allow USDC transfers to userbanks', async function () {
      await audiusLibsWrapper.init()
      const libs = await audiusLibsWrapper.getAudiusLibsAsync()
      const wallet = libs.web3Manager!.getWalletAddress()
      const userbank = await libs.solanaWeb3Manager!.deriveUserBank({
        mint: 'usdc'
      })

      const source = getRandomPublicKey()
      const owner = getRandomPublicKey()
      const instructions = [
        createTransferCheckedInstruction(
          source,
          usdcMintKey,
          userbank,
          owner,
          1,
          6
        )
      ]
      await assertRelayAllowedInstructions(instructions, {
        walletAddress: wallet
      })
    })

    it('should not allow transfers to non-userbanks', async function () {
      await audiusLibsWrapper.init()
      const libs = await audiusLibsWrapper.getAudiusLibsAsync()
      const wallet = libs.web3Manager!.getWalletAddress()

      const source = getRandomPublicKey()
      const owner = getRandomPublicKey()
      const destination = getRandomPublicKey()
      const instructions = [
        createTransferCheckedInstruction(
          source,
          usdcMintKey,
          destination,
          owner,
          1,
          6
        )
      ]

      await assertThrows(
        async () => assertRelayAllowedInstructions(instructions),
        InvalidRelayInstructionError,
        'Not logged in'
      )

      await assertThrows(
        async () =>
          assertRelayAllowedInstructions(instructions, {
            walletAddress: wallet
          }),
        InvalidRelayInstructionError,
        'Transfer not to userbank'
      )
    })

    it('should not allow other instructions (non-exhaustive)', async function () {
      const account = getRandomPublicKey()
      const owner = getRandomPublicKey()
      await assertThrows(
        async () =>
          assertRelayAllowedInstructions([
            createInitializeAccountInstruction(account, usdcMintKey, owner)
          ]),
        InvalidRelayInstructionError,
        'initializeAccount'
      )
      const delegate = getRandomPublicKey()
      await assertThrows(
        async () =>
          assertRelayAllowedInstructions([
            createApproveInstruction(account, delegate, owner, 0)
          ]),
        InvalidRelayInstructionError,
        'approve'
      )
    })
  })

  // describe('Reward Manager Program Checks', function () {
  //   it('should allow public instructions with valid authority', async function () {
  //     throw Error('Not Implemented')
  //   })
  // })

  describe('Claimable Tokens Program Checks', function () {
    it('should allow claimable token program instructions with valid authority', async function () {
      const wallet = '0x1ABC7154748D1CE5144478CDEB574AE244B939B5'
      const payer = getRandomPublicKey()
      const mint = getRandomPublicKey()
      const userbank = getRandomPublicKey()
      const destination = getRandomPublicKey()
      const nonceAccount = getRandomPublicKey()
      const instructions = [
        createClaimableTokenAccountInstruction(
          wallet,
          payer,
          mint,
          usdcClaimableTokenAuthority,
          userbank,
          TOKEN_PROGRAM_ID,
          CLAIMABLE_TOKEN_PROGRAM_ID
        ),
        createTransferClaimableTokenInstruction(
          payer,
          userbank,
          destination,
          nonceAccount,
          0n,
          usdcClaimableTokenAuthority,
          1n,
          TOKEN_PROGRAM_ID,
          CLAIMABLE_TOKEN_PROGRAM_ID
        ),
        createClaimableTokenAccountInstruction(
          wallet,
          payer,
          mint,
          audioClaimableTokenAuthority,
          userbank,
          TOKEN_PROGRAM_ID,
          CLAIMABLE_TOKEN_PROGRAM_ID
        ),
        createTransferClaimableTokenInstruction(
          payer,
          userbank,
          destination,
          nonceAccount,
          0n,
          audioClaimableTokenAuthority,
          1n,
          TOKEN_PROGRAM_ID,
          CLAIMABLE_TOKEN_PROGRAM_ID
        )
      ]
      await assertRelayAllowedInstructions(instructions)
    })

    it('should not allow claimable token program instructions with invalid authority', async function () {
      const wallet = '0x1ABC7154748D1CE5144478CDEB574AE244B939B5'
      const payer = getRandomPublicKey()
      const mint = getRandomPublicKey()
      const authority = getRandomPublicKey()
      const userbank = getRandomPublicKey()
      const destination = getRandomPublicKey()
      const nonceAccount = getRandomPublicKey()
      await assertThrows(
        async () =>
          assertRelayAllowedInstructions([
            createClaimableTokenAccountInstruction(
              wallet,
              payer,
              mint,
              authority,
              userbank,
              TOKEN_PROGRAM_ID,
              CLAIMABLE_TOKEN_PROGRAM_ID
            )
          ]),
        InvalidRelayInstructionError,
        'Invalid authority for create user bank'
      )
      await assertThrows(
        async () =>
          assertRelayAllowedInstructions([
            createTransferClaimableTokenInstruction(
              payer,
              userbank,
              destination,
              nonceAccount,
              0n,
              authority,
              1n,
              TOKEN_PROGRAM_ID,
              CLAIMABLE_TOKEN_PROGRAM_ID
            )
          ]),
        InvalidRelayInstructionError,
        'Invalid authority for transfer user bank'
      )
    })
  })

  describe('Jupiter Swap Program', function () {
    it('should allow Jupiter sharedAccountsRoute swaps between USDC and SOL when authenticated', async function () {
      const JUPITER_AGGREGATOR_V6_PROGRAM_ID = new PublicKey(
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
      )
      const programAuthority = getRandomPublicKey()
      const userTransferAuthority = getRandomPublicKey()
      const sourceTokenAccount = getRandomPublicKey()
      const programSourceTokenAccount = getRandomPublicKey()
      const programDestinationTokenAccount = getRandomPublicKey()
      const destinationTokenAccount = getRandomPublicKey()
      const instructions = [
        new TransactionInstruction({
          programId: JUPITER_AGGREGATOR_V6_PROGRAM_ID,
          data: Buffer.from([
            193, 32, 155, 51, 65, 214, 156, 129, 2, 1, 0, 0, 0, 3, 100, 0, 1,
            92, 161, 0, 0, 0, 0, 0, 0, 236, 52, 31, 0, 0, 0, 0, 0, 3, 0, 0
          ]),
          keys: [
            {
              pubkey: TOKEN_PROGRAM_ID,
              isSigner: false,
              isWritable: false
            },
            {
              pubkey: programAuthority,
              isSigner: false,
              isWritable: false
            },
            {
              pubkey: userTransferAuthority,
              isSigner: true,
              isWritable: true
            },
            {
              pubkey: sourceTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: programSourceTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: programDestinationTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: destinationTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: usdcMintKey,
              isSigner: false,
              isWritable: false
            },
            {
              pubkey: NATIVE_MINT,
              isSigner: false,
              isWritable: false
            }
          ]
        })
      ]

      await assertRelayAllowedInstructions(instructions, {
        walletAddress: 'something'
      })
    })

    it('should not allow Jupiter sharedAccountsRoute when not authenticated', async function () {
      const JUPITER_AGGREGATOR_V6_PROGRAM_ID = new PublicKey(
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
      )
      const programAuthority = getRandomPublicKey()
      const userTransferAuthority = getRandomPublicKey()
      const sourceTokenAccount = getRandomPublicKey()
      const programSourceTokenAccount = getRandomPublicKey()
      const programDestinationTokenAccount = getRandomPublicKey()
      const destinationTokenAccount = getRandomPublicKey()
      const instructions = [
        new TransactionInstruction({
          programId: JUPITER_AGGREGATOR_V6_PROGRAM_ID,
          data: Buffer.from([
            193, 32, 155, 51, 65, 214, 156, 129, 2, 1, 0, 0, 0, 3, 100, 0, 1,
            92, 161, 0, 0, 0, 0, 0, 0, 236, 52, 31, 0, 0, 0, 0, 0, 3, 0, 0
          ]),
          keys: [
            {
              pubkey: TOKEN_PROGRAM_ID,
              isSigner: false,
              isWritable: false
            },
            {
              pubkey: programAuthority,
              isSigner: false,
              isWritable: false
            },
            {
              pubkey: userTransferAuthority,
              isSigner: true,
              isWritable: true
            },
            {
              pubkey: sourceTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: programSourceTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: programDestinationTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: destinationTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: usdcMintKey,
              isSigner: false,
              isWritable: false
            },
            {
              pubkey: NATIVE_MINT,
              isSigner: false,
              isWritable: false
            }
          ]
        })
      ]

      await assertThrows(
        async () => assertRelayAllowedInstructions(instructions),
        InvalidRelayInstructionError,
        'Unauthorized'
      )
    })

    it('should not allow Jupiter sharedAccountsRoute swaps between other mints', async function () {
      const JUPITER_AGGREGATOR_V6_PROGRAM_ID = new PublicKey(
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
      )
      const programAuthority = getRandomPublicKey()
      const userTransferAuthority = getRandomPublicKey()
      const sourceTokenAccount = getRandomPublicKey()
      const programSourceTokenAccount = getRandomPublicKey()
      const programDestinationTokenAccount = getRandomPublicKey()
      const destinationTokenAccount = getRandomPublicKey()
      const instructions = [
        new TransactionInstruction({
          programId: JUPITER_AGGREGATOR_V6_PROGRAM_ID,
          data: Buffer.from([
            193, 32, 155, 51, 65, 214, 156, 129, 2, 1, 0, 0, 0, 3, 100, 0, 1,
            92, 161, 0, 0, 0, 0, 0, 0, 236, 52, 31, 0, 0, 0, 0, 0, 3, 0, 0
          ]),
          keys: [
            {
              pubkey: TOKEN_PROGRAM_ID,
              isSigner: false,
              isWritable: false
            },
            {
              pubkey: programAuthority,
              isSigner: false,
              isWritable: false
            },
            {
              pubkey: userTransferAuthority,
              isSigner: true,
              isWritable: true
            },
            {
              pubkey: sourceTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: programSourceTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: programDestinationTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: destinationTokenAccount,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: usdcMintKey,
              isSigner: false,
              isWritable: false
            },
            {
              pubkey: audioMintKey,
              isSigner: false,
              isWritable: false
            }
          ]
        })
      ]

      await assertThrows(
        async () =>
          assertRelayAllowedInstructions(instructions, {
            walletAddress: 'something'
          }),
        InvalidRelayInstructionError,
        'Invalid mints for swap'
      )
    })
  })
})
