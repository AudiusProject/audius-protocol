import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createApproveInstruction,
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  createSyncNativeInstruction,
  createTransferCheckedInstruction
} from '@solana/spl-token'
import {
  Keypair,
  PublicKey,
  Secp256k1Program,
  SystemProgram,
  TransactionInstruction
} from '@solana/web3.js'
import assert from 'assert'
import { assertRelayAllowedInstructions } from './assertRelayAllowedInstructions'
import { config } from '../../config'
import {
  ClaimableTokensProgram,
  RewardManagerProgram,
  RewardManagerInstruction
} from '@audius/spl'
import { InvalidRelayInstructionError } from './InvalidRelayInstructionError'
import { describe, it } from 'vitest'
import { AudiusLibs } from '@audius/sdk'

const CLAIMABLE_TOKEN_PROGRAM_ID = new PublicKey(config.claimableTokenProgramId)

const REWARD_MANAGER_PROGRAM_ID = new PublicKey(config.rewardsManagerProgramId)
const REWARD_MANAGER_ACCOUNT = new PublicKey(
  config.rewardsManagerAccountAddress
)

const MEMO_PROGRAM_ID = new PublicKey(
  'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'
)
const MEMO_V2_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
)

const usdcMintKey = new PublicKey(config.usdcMintAddress)
const audioMintKey = new PublicKey(config.waudioMintAddress)

const usdcClaimableTokenAuthority = PublicKey.findProgramAddressSync(
  [usdcMintKey.toBytes().slice(0, 32)],
  CLAIMABLE_TOKEN_PROGRAM_ID
)[0]
const audioClaimableTokenAuthority = PublicKey.findProgramAddressSync(
  [audioMintKey.toBytes().slice(0, 32)],
  CLAIMABLE_TOKEN_PROGRAM_ID
)[0]

const getRandomPublicKey = () => Keypair.generate().publicKey

const getInittedLibs = async () => {
  // @ts-ignore
  const libs = new AudiusLibs({
    solanaWeb3Config: {
      solanaClusterEndpoint: config.solanaEndpoint,
      mintAddress: config.waudioMintAddress,
      usdcMintAddress: config.usdcMintAddress,
      solanaTokenAddress: TOKEN_PROGRAM_ID.toBase58(),
      feePayerAddress: config.solanaFeePayerWallets[0].publicKey,
      claimableTokenProgramAddress: config.claimableTokenProgramId,
      rewardsManagerProgramId: config.rewardsManagerProgramId,
      rewardsManagerProgramPDA: config.rewardsManagerAccountAddress,
      rewardsManagerTokenPDA: '',
      useRelay: false,
      confirmationTimeout: 0,
      paymentRouterProgramId: config.paymentRouterProgramId
    }
  })
  await libs.init()
  return libs
}

describe('Solana Relay', function () {
  describe('Associated Token Account Program', function () {
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
    })

    it('should allow create/close matches regardless of order', async function () {
      const payer = getRandomPublicKey()
      const associatedToken = getRandomPublicKey()
      const owner = getRandomPublicKey()
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
      await assert.rejects(
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
      await assert.rejects(
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
      await assert.rejects(
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
      await assert.rejects(
        async () => assertRelayAllowedInstructions(instructions),
        InvalidRelayInstructionError,
        'Mint not allowed'
      )
    })
  })

  describe('Token Program', function () {
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
      // Dummy eth address to make the encoder happy
      const wallet = '0xe42b199d864489387bf64262874fc6472bcbc151'
      const userbank = await (
        await getInittedLibs()
      ).solanaWeb3Manager!.deriveUserBank({
        mint: 'usdc',
        ethAddress: wallet
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
        user: {
          walletAddress: wallet
        }
      })
    })

    it('should not allow transfers to non-userbanks', async function () {
      // Some dummy eth addresses to make the encoder happy
      const wallet = '0x1dc3070311552fce47e06db9f4f1328187f14c85'

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

      await assert.rejects(
        async () => assertRelayAllowedInstructions(instructions),
        InvalidRelayInstructionError,
        'Not logged in'
      )

      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions(instructions, {
            user: {
              walletAddress: wallet
            }
          }),
        InvalidRelayInstructionError,
        'Transfer not to userbank'
      )
    })

    it('should allow syncNative instructions', async function () {
      await assertRelayAllowedInstructions([
        createSyncNativeInstruction(getRandomPublicKey())
      ])
    })

    it('should not allow other instructions (non-exhaustive)', async function () {
      const account = getRandomPublicKey()
      const owner = getRandomPublicKey()
      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            createInitializeAccountInstruction(account, usdcMintKey, owner)
          ]),
        InvalidRelayInstructionError,
        'initializeAccount'
      )
      const delegate = getRandomPublicKey()
      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            createApproveInstruction(account, delegate, owner, 0)
          ]),
        InvalidRelayInstructionError,
        'approve'
      )
    })
  })

  describe('Reward Manager Program', function () {
    it('should allow public instructions with valid reward manager', async function () {
      const disbursementId = 'some:id:thing'
      // Some dummy eth addresses to make the encoder happy
      const senderEthAddress = '0x1dc3070311552fce47e06db9f4f1328187f14c85'
      const operatorEthAddress = '0x430ef095e4c5ac71a465b30d566bab0bb0985346'
      const recipientEthAddress = '0x7311c8ec02f087cba0fdbb056d4cebc86519d871'
      const attestations = getRandomPublicKey()
      const authority = getRandomPublicKey()
      const payer = getRandomPublicKey()
      const sender = getRandomPublicKey()
      const rewardManagerTokenSource = getRandomPublicKey()
      const destinationUserBank = getRandomPublicKey()
      const disbursementAccount = getRandomPublicKey()
      const antiAbuseOracle = getRandomPublicKey()
      const existingSenders = [
        getRandomPublicKey(),
        getRandomPublicKey(),
        getRandomPublicKey()
      ]
      await assertRelayAllowedInstructions([
        RewardManagerProgram.createSenderPublicInstruction({
          senderEthAddress,
          operatorEthAddress,
          rewardManagerState: REWARD_MANAGER_ACCOUNT,
          authority,
          payer,
          sender,
          existingSenders,
          rewardManagerProgramId: REWARD_MANAGER_PROGRAM_ID
        }),
        RewardManagerProgram.createSubmitAttestationInstruction({
          disbursementId,
          attestations,
          rewardManagerState: REWARD_MANAGER_ACCOUNT,
          authority,
          payer,
          sender,
          rewardManagerProgramId: REWARD_MANAGER_PROGRAM_ID
        }),
        RewardManagerProgram.createEvaluateAttestationsInstruction({
          disbursementId,
          recipientEthAddress,
          amount: BigInt(100),
          attestations,
          rewardManagerState: REWARD_MANAGER_ACCOUNT,
          authority,
          rewardManagerTokenSource,
          destinationUserBank,
          disbursementAccount,
          antiAbuseOracle,
          payer,
          tokenProgramId: TOKEN_PROGRAM_ID,
          rewardManagerProgramId: REWARD_MANAGER_PROGRAM_ID
        })
      ])
    })

    it('should not allow public instructions with invalid reward manager', async function () {
      const disbursementId = 'some:id:thing'
      // Some dummy eth addresses to make the encoder happy
      const senderEthAddress = '0x1dc3070311552fce47e06db9f4f1328187f14c85'
      const operatorEthAddress = '0x430ef095e4c5ac71a465b30d566bab0bb0985346'
      const recipientEthAddress = '0x7311c8ec02f087cba0fdbb056d4cebc86519d871'
      const attestations = getRandomPublicKey()
      const authority = getRandomPublicKey()
      const payer = getRandomPublicKey()
      const sender = getRandomPublicKey()
      const rewardManagerState = getRandomPublicKey()
      const rewardManagerTokenSource = getRandomPublicKey()
      const destinationUserBank = getRandomPublicKey()
      const disbursementAccount = getRandomPublicKey()
      const antiAbuseOracle = getRandomPublicKey()
      const existingSenders = [
        getRandomPublicKey(),
        getRandomPublicKey(),
        getRandomPublicKey()
      ]
      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            RewardManagerProgram.createSenderPublicInstruction({
              senderEthAddress,
              operatorEthAddress,
              rewardManagerState,
              authority,
              payer,
              sender,
              existingSenders,
              rewardManagerProgramId: REWARD_MANAGER_PROGRAM_ID
            })
          ]),
        InvalidRelayInstructionError,
        'invalid reward manager for createSenderPublic'
      )

      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            RewardManagerProgram.createSubmitAttestationInstruction({
              disbursementId,
              attestations,
              rewardManagerState,
              authority,
              payer,
              sender,
              rewardManagerProgramId: REWARD_MANAGER_PROGRAM_ID
            })
          ]),
        InvalidRelayInstructionError,
        'invalid reward manager for submitAttestation'
      )
      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            RewardManagerProgram.createEvaluateAttestationsInstruction({
              disbursementId,
              recipientEthAddress,
              amount: BigInt(100),
              attestations,
              rewardManagerState,
              authority,
              rewardManagerTokenSource,
              destinationUserBank,
              disbursementAccount,
              antiAbuseOracle,
              payer,
              tokenProgramId: TOKEN_PROGRAM_ID,
              rewardManagerProgramId: REWARD_MANAGER_PROGRAM_ID
            })
          ]),
        InvalidRelayInstructionError,
        'invalid reward manager for evaluateAttestations'
      )
    })

    it('should not allow non-public instructions', async function () {
      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            new TransactionInstruction({
              programId: REWARD_MANAGER_PROGRAM_ID,
              keys: [],
              data: Buffer.from([RewardManagerInstruction.Init])
            })
          ]),
        'reward manager init'
      )
      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            new TransactionInstruction({
              programId: REWARD_MANAGER_PROGRAM_ID,
              keys: [],
              data: Buffer.from([RewardManagerInstruction.ChangeManagerAccount])
            })
          ]),
        'reward manager change manager account'
      )
      // Some dummy eth addresses to make the encoder happy
      const senderEthAddress = '0x1dc3070311552fce47e06db9f4f1328187f14c85'
      const operatorEthAddress = '0x430ef095e4c5ac71a465b30d566bab0bb0985346'
      const authority = getRandomPublicKey()
      const payer = getRandomPublicKey()
      const sender = getRandomPublicKey()
      const rewardManagerState = getRandomPublicKey()
      const manager = getRandomPublicKey()
      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            RewardManagerProgram.createSenderInstruction({
              senderEthAddress,
              operatorEthAddress,
              rewardManagerState,
              manager,
              authority,
              payer,
              sender,
              rewardManagerProgramId: REWARD_MANAGER_PROGRAM_ID
            })
          ]),
        'reward manager create sender'
      )
      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            new TransactionInstruction({
              programId: REWARD_MANAGER_PROGRAM_ID,
              keys: [],
              data: Buffer.from([RewardManagerInstruction.DeleteSender])
            })
          ]),
        'non public delete sender'
      )
    })
  })

  describe('Claimable Tokens Program', function () {
    it('should allow claimable token program instructions with valid authority', async function () {
      // Dummy eth address to make the encoder happy
      const wallet = '0xe42b199d864489387bf64262874fc6472bcbc151'
      const payer = getRandomPublicKey()
      const mint = getRandomPublicKey()
      const userBank = getRandomPublicKey()
      const destination = getRandomPublicKey()
      const nonceAccount = getRandomPublicKey()
      const instructions = [
        ClaimableTokensProgram.createAccountInstruction({
          ethAddress: wallet,
          payer,
          mint,
          authority: usdcClaimableTokenAuthority,
          userBank
        }),
        ClaimableTokensProgram.createTransferInstruction({
          payer,
          sourceEthAddress: wallet,
          sourceUserBank: userBank,
          destination,
          nonceAccount,
          authority: usdcClaimableTokenAuthority
        }),
        ClaimableTokensProgram.createAccountInstruction({
          ethAddress: wallet,
          payer,
          mint,
          authority: audioClaimableTokenAuthority,
          userBank
        }),
        ClaimableTokensProgram.createTransferInstruction({
          payer,
          sourceEthAddress: wallet,
          sourceUserBank: userBank,
          destination,
          nonceAccount,
          authority: audioClaimableTokenAuthority
        })
      ]
      await assertRelayAllowedInstructions(instructions)
    })

    it('should not allow claimable token program instructions with invalid authority', async function () {
      // Dummy eth addresse to make the encoder happy
      const wallet = '0x36034724e7bda41d5142efd85e1f6773460f5679'
      const payer = getRandomPublicKey()
      const mint = getRandomPublicKey()
      const authority = getRandomPublicKey()
      const userBank = getRandomPublicKey()
      const destination = getRandomPublicKey()
      const nonceAccount = getRandomPublicKey()
      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            ClaimableTokensProgram.createAccountInstruction({
              ethAddress: wallet,
              payer,
              mint,
              authority,
              userBank
            })
          ]),
        'Invalid authority for create user bank'
      )
      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            ClaimableTokensProgram.createTransferInstruction({
              payer,
              sourceEthAddress: wallet,
              sourceUserBank: userBank,
              destination,
              nonceAccount,
              authority
            })
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
        user: {
          walletAddress: 'something'
        }
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

      await assert.rejects(
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
      const randomDestinationMint = getRandomPublicKey()
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
              pubkey: randomDestinationMint,
              isSigner: false,
              isWritable: false
            }
          ]
        })
      ]

      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions(instructions, {
            user: {
              walletAddress: 'something'
            }
          }),
        InvalidRelayInstructionError,
        'Invalid mints for swap'
      )
    })

    it('should not allow Jupiter sharedAccountsRoute swaps using the fee payer', async function () {
      const JUPITER_AGGREGATOR_V6_PROGRAM_ID = new PublicKey(
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
      )
      const programAuthority = getRandomPublicKey()
      const userTransferAuthority = config.solanaFeePayerWallets[0].publicKey
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

      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions(instructions, {
            user: {
              walletAddress: 'something'
            }
          }),
        InvalidRelayInstructionError,
        'Invalid user transfer authority'
      )
    })
  })

  describe('System Program', function () {
    it('should allow transfers when authenticated', async function () {
      const feePayer = getRandomPublicKey()
      const fromPubkey = getRandomPublicKey()
      const toPubkey = getRandomPublicKey()
      // Dummy eth address, no significance
      const walletAddress = '0x36034724e7bda41d5142efd85e1f6773460f5679'
      await assertRelayAllowedInstructions(
        [
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: 1
          })
        ],
        { user: { walletAddress }, feePayer: feePayer.toBase58() }
      )
    })

    it('should not allow transfers when not authenticated', async function () {
      const feePayer = getRandomPublicKey()
      const fromPubkey = getRandomPublicKey()
      const toPubkey = getRandomPublicKey()
      await assert.rejects(async () =>
        assertRelayAllowedInstructions([
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: 1
          })
        ])
      )
    })

    it('should not allow transfers from the feePayer', async function () {
      const walletAddress = '0x36034724e7bda41d5142efd85e1f6773460f5679'
      const feePayer = getRandomPublicKey()
      const toPubkey = getRandomPublicKey()
      await assert.rejects(async () =>
        assertRelayAllowedInstructions(
          [
            SystemProgram.transfer({
              fromPubkey: feePayer,
              toPubkey,
              lamports: 1
            })
          ],

          { user: { walletAddress }, feePayer: feePayer.toBase58() }
        )
      )
    })

    it('should not allow other system instructions', async function () {
      const walletAddress = '0x36034724e7bda41d5142efd85e1f6773460f5679'
      const feePayer = getRandomPublicKey()
      const fromPubkey = getRandomPublicKey()
      const newAccountPubkey = getRandomPublicKey()
      const programId = getRandomPublicKey()
      await assert.rejects(async () =>
        assertRelayAllowedInstructions(
          [
            SystemProgram.createAccount({
              fromPubkey,
              newAccountPubkey,
              programId,
              lamports: 1,
              space: 0
            })
          ],

          { user: { walletAddress }, feePayer: feePayer.toBase58() }
        )
      )
    })
  })

  describe('Other Programs', function () {
    it('allows memo and SECP instructions', async function () {
      await assertRelayAllowedInstructions([
        new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [] }),
        new TransactionInstruction({ programId: MEMO_V2_PROGRAM_ID, keys: [] }),
        Secp256k1Program.createInstructionWithEthAddress({
          // Dummy eth address to make the encoder happy
          ethAddress: '0xe42b199d864489387bf64262874fc6472bcbc151',
          message: Buffer.from('some message', 'utf-8'),
          signature: Buffer.alloc(64),
          recoveryId: 0
        })
      ])
    })

    it('does not allow other random programs', async function () {
      await assert.rejects(
        async () =>
          assertRelayAllowedInstructions([
            new TransactionInstruction({
              programId: getRandomPublicKey(),
              keys: []
            })
          ]),
        InvalidRelayInstructionError,
        'random program'
      )
    })
  })
})
