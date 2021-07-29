import { Connection, PublicKey, Secp256k1Program, sendAndConfirmTransaction, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js"
import BN from 'bn.js'

/// Sender program account seed
const SENDER_SEED_PREFIX = "S_"

// 1 + 32 + 1 + (168 * 5)
const VERIFIED_MESSAGES_LEN = 874

// 3qvNmjbxmF9CDHzAEBvLSePRiMWtVcXPaRPiPtmrT29xkj

// TODO: this should work with *multiple* votes
async function verifyTransferSignature({
  rewardManagerProgramId,
  rewardManagerAccount,
  ethAddress,
  challengeId,
  specifier,
  feePayer,
  feePayerSecret, // Remove this :)
  attestationSignature,
  spOwnerWallet,
  recoveryId,
  recipientEthAddress,
  tokenAmount,
  oracleAddress,
}: {
  rewardManagerProgramId: PublicKey,
  rewardManagerAccount: PublicKey,
  ethAddress: string,
  challengeId: string,
  specifier: string,
  feePayer: PublicKey,
  feePayerSecret: Uint8Array,
  attestationSignature: string,
  spOwnerWallet: string,
  recoveryId: number,
  recipientEthAddress: string,
  tokenAmount: number, // TODO: this should be a BN I think?
  oracleAddress: string
}) {
  const connection = new Connection('https://api.devnet.solana.com')
  const encoder = new TextEncoder()
  const encodedPrefix = encoder.encode(SENDER_SEED_PREFIX)

  // TOOD: this *might* have to be hashed?
  const strippedEthAddress = ethAddress.replace('0x', '')
  const ethAddressArr = Uint8Array.of(
    ...new BN(strippedEthAddress, 'hex').toArray('be')
  )

  const [, derivedSender, ] = await findDerivedPair(
    rewardManagerProgramId,
    rewardManagerAccount,
    new Uint8Array([...encodedPrefix, ...ethAddressArr])
  )

  const [messageHolderAccount, ] = await deriveMessageAccount(challengeId, specifier, rewardManagerProgramId)

  // TODO: create the instruction

    ///   Verify transfer signature
    ///
    ///   0. `[writable]` New or existing account storing verified messages
    ///   1. `[]` Reward manager
    ///   2. `[]` Sender
    ///   3. `[]` Sysvar instruction id
  const verifyInstructionAccounts = [
    {
      pubkey: messageHolderAccount,
      isSigner: false,
      isWritable: true
    },
    {
      pubkey: rewardManagerProgramId,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: derivedSender,
      isSigner: false, // IDK?
      isWritable: false
    }, {
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
      isSigner: false,
      isWritable: false
    }
  ]

  // TODO: should we use a fixed rent amt?
  const accountRent = await connection.getMinimumBalanceForRentExemption(VERIFIED_MESSAGES_LEN)
  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: feePayer,
    newAccountPubkey: messageHolderAccount,
    lamports: accountRent,
    space: VERIFIED_MESSAGES_LEN,
    programId: rewardManagerProgramId
  })

  const verifyTransferSignatureInstruction = new TransactionInstruction({
    keys: verifyInstructionAccounts,
    programId: rewardManagerProgramId,
    data: Buffer.from(Uint8Array.of(4))
  })

  // export type CreateSecp256k1InstructionWithEthAddressParams = {
  //   ethAddress: Buffer | Uint8Array | Array<number> | string;
  //   message: Buffer | Uint8Array | Array<number>;
  //   signature: Buffer | Uint8Array | Array<number>;
  //   recoveryId: number;
  // };

  // TODO: pull this out into a new function
  const transferId = `${challengeId}::${specifier}}`
  // attestation
  const senderMessage = [
    recipientEthAddress,
    tokenAmount,
    transferId,
    oracleAddress
  ].join("_")

  const encodedSenderMessage = encoder.encode(senderMessage)
  const encodedSignature = encoder.encode(attestationSignature)

  const secpInstruction = Secp256k1Program.createInstructionWithEthAddress({
    ethAddress: spOwnerWallet,
    message: encodedSenderMessage,
    signature: encodedSignature,
    recoveryId,
  })

  const instructions = [
    createAccountInstruction,
    secpInstruction,
    verifyTransferSignatureInstruction
  ]



  // export type TransactionCtorFields = {
  //   /** A recent blockhash */
  //   recentBlockhash?: Blockhash | null;
  //   /** Optional nonce information used for offline nonce'd transactions */
  //   nonceInfo?: NonceInformation | null;
  //   /** The transaction fee payer */
  //   feePayer?: PublicKey | null;
  //   /** One or more signatures */
  //   signatures?: Array<SignaturePubkeyPair>;
  // };

  const {blockhash: recentBlockhash} = await connection.getRecentBlockhash()
  const transaction = new Transaction({
    recentBlockhash,
    feePayer
  })
  transaction.add(...instructions)
  // Sign with the fee payer
  transaction.sign({
    publicKey: feePayer,
    secretKey: feePayerSecret
  })

    const transactionSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [
        {
          publicKey: feePayer,
          secretKey: feePayerSecret
        }
      ],
      {
        skipPreflight: true,
        commitment: 'processed',
        preflightCommitment: 'processed'
      }
    )

  // The data for the
  // Instructions:
  // TODO: only do it sometimes
  // 1) create_account for verified messages
  // 2)
}

// class VerifyTransferSignatureInstructionData {
//   constructor({

//   })
// }


// class CreateTokenAccountInstructionData {
//   constructor ({
//     ethAddress
//   }) {
//     this.hashed_eth_pk = ethAddress
//   }
// }

// const createTokenAccountInstructionSchema = new Map([
//   [
//     CreateTokenAccountInstructionData,
//     {
//       kind: 'struct',
//       fields: [
//         ['hashed_eth_pk', [20]]
//       ]
//     }
//   ]
// ])
// Derives the account for messages to live in
const deriveMessageAccount = async (challengeId: string, specifier: string, rewardsProgramId: PublicKey) => {
  const combined = `${challengeId}:${specifier}`
  const encoder = new TextEncoder()
  const bytes = encoder.encode(combined)
  // TODO: is there any reason to also have a pubkey here as the seed?
  return PublicKey.findProgramAddress([bytes], rewardsProgramId)
}

const findProgramAddress = (programId: PublicKey, pubkey: PublicKey) => {
  return PublicKey.findProgramAddress([pubkey.toBytes().slice(0, 32)], programId)
}

// Finds a 'derived' address by finding a programAddress with
// seeds array  as first 32 bytes of base + seeds
// Returns [derivedAddress, bumpSeed]
const findDerivedAddress = (programId: PublicKey, base: PublicKey, seed: Uint8Array) => {
  return PublicKey.findProgramAddress([base.toBytes().slice(0, 32), seed], programId)
}

const findDerivedPair = async (programId: PublicKey, rewardManager: PublicKey, seed: Uint8Array): Promise<[PublicKey, PublicKey,number ]> => {
  // Finds the rewardManagerAuthority account by generating
  // a PDA with the rewardsMnager as a seed
  const [rewardManagerAuthority,] = await findProgramAddress(programId, rewardManager)
  const [derivedAddress, bumpSeed] = await findDerivedAddress(programId, rewardManagerAuthority, seed)
  return [rewardManagerAuthority, derivedAddress, bumpSeed]
}