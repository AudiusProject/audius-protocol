const {
  SystemProgram,
  PublicKey,
  Secp256k1Program,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction
} = require('@solana/web3.js')
const BN = require('bn.js')
const borsh = require('borsh')
const SolanaUtils = require('./utils')
const secp256k1 = require('secp256k1')
const { ClaimableProgramError } = require('./errors')

const encoder = new TextEncoder()

const TRANSFER_NONCE_PREFIX = 'N_'

/**
 * Derives the 'transfer nonce account' - the account which contains the nonce for transfers
 * and is used to prevent replay attacks
 *
 * @param {string} ethAddress
 * @param {PublicKey} rewardProgramId
 * @param {PublicKey} rewardManager
 * @returns {Promise<PublicKey>}
 */
const deriveTransferNonceAccount = async ({
  ethAddress,
  mintKey,
  claimableTokenProgramKey
}) => {
  const ethAddressArr = SolanaUtils.ethAddressToArray(ethAddress)
  const seed = Uint8Array.from([
    ...encoder.encode(TRANSFER_NONCE_PREFIX),
    ...ethAddressArr
  ])

  const res = await SolanaUtils.findProgramAddressWithAuthority(
    claimableTokenProgramKey,
    mintKey,
    seed
  )
  return res[1]
}

class NonceAccount {
  constructor ({
    version,
    nonce
  }) {
    this.version = version
    this.nonce = nonce
  }
}

const NonceAccountSchema = new Map([
  [
    NonceAccount,
    {
      kind: 'struct',
      fields: [
        ['version', 'u8'],
        ['nonce', 'u64']
      ]
    }
  ]
])

/**
 * Retrieves the nonce account for transfers, if non-existant it returns 0
 * @param {object} params
 * @param {object} params.connection Solana web3 connection
 * @param {string} params.ethAddress Eth Address
 * @param {PublicKey} params.mintKey Public key of the minted spl token
 * @param {PublicKey} params.claimableTokenProgramKey Program public key
 */
async function getAccountNonce ({
  connection,
  ethAddress,
  mintKey,
  claimableTokenProgramKey
}) {
  let nonce = 0
  const transferNonceAccount = await deriveTransferNonceAccount({
    ethAddress,
    mintKey,
    claimableTokenProgramKey
  })
  let accInfo = await connection.getAccountInfoAndContext(transferNonceAccount)
  if (accInfo.value) {
    const nonceAccount = borsh.deserialize(NonceAccountSchema, NonceAccount, accInfo.value.data);
    nonce = nonceAccount.nonce
  }
  return {
    accountNonce: transferNonceAccount,
    nonce
  }
}


/**
 * Transfer wAUDIO between wallets on solana
 */
class TransferInstructionData {
  constructor ({
    targetPubKey,
    amount,
    nonce
  }) {
    this.target_pubkey = targetPubKey
    this.amount = amount
    this.nonce = nonce
  }
}

const transferInstructionDataSchema = new Map([
  [
    TransferInstructionData,
    {
      kind: 'struct',
      fields: [
        ['target_pubkey', [32]],
        ['amount', 'u64'],
        ['nonce', 'u64']
      ]
    }
  ]
])

/**
 * transferWAudioBalance transfers wrapped Audio from one generated solana account to another.
 * For it to work, you have to have the eth private key belonging to the eth public key
 * that generated the solana account
 *
 * @param {BN} amount amount to send
 * @param {string} senderEthAddress sender's eth address (e.g. you)
 * @param {string} senderEthPrivateKey sender's eth private key
 * @param {string} senderSolanaAddress sender's solana address
 * @param {string} recipientSolanaAddress recipient's solana address
 * @param {string} claimableTokenPDA
 * @param {PublicKey} solanaTokenProgramKey spl token key
 * @param {Connection} connection
 * @returns
 */
async function transferWAudioBalance ({
  amount,
  senderEthAddress,
  senderEthPrivateKey,
  senderSolanaAddress,
  recipientSolanaAddress,
  claimableTokenPDA,
  solanaTokenProgramKey,
  feePayerKey,
  claimableTokenProgramKey,
  connection,
  mintKey,
  transactionHandler
}) {

  const senderSolanaPubkey = new PublicKey(senderSolanaAddress)
  const recipientPubkey = new PublicKey(recipientSolanaAddress)

  const {
    accountNonce,
    nonce
  } = await getAccountNonce({
    connection,
    mintKey,
    ethAddress: senderEthAddress,
    claimableTokenProgramKey
  })

  const accounts = [
    // 0. `[sw]` Fee payer
    {
      pubkey: feePayerKey,
      isSigner: true,
      isWritable: false
    },
    // 1. `[w]` Token acc from which tokens will be send (bank account)
    {
      pubkey: senderSolanaPubkey,
      isSigner: false,
      isWritable: true
    },
    // 2. `[w]` Receiver token acc
    {
      pubkey: recipientPubkey,
      isSigner: false,
      isWritable: true
    },
    // 3. `[w]` Nonce Account
    {
      pubkey: accountNonce,
      isSigner: false,
      isWritable: true
    },
    // 4. `[r]` Banks token account authority
    {
      pubkey: claimableTokenPDA,
      isSigner: false,
      isWritable: false
    },
    // 5. `[r]` Sysvar Rent id
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    // 6. `[r]` Sysvar instruction id
    {
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    // 7. `[r]` Sysvar program id
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    },
    // 8. `[r]` SPL token account id
    {
      pubkey: solanaTokenProgramKey,
      isSigner: false,
      isWritable: false
    }
  ]

  // eth pubkey is different from the ethAddress - addresses are len 20, pub keys are len 64
  const ethPrivateKeyArr = Buffer.from(senderEthPrivateKey, 'hex')
  const ethPubkey = secp256k1.publicKeyCreate(ethPrivateKeyArr, false).slice(1)

  const instructionData = new TransferInstructionData({
    targetPubKey: recipientPubkey.toBuffer(),
    amount,
    nonce
  })

  const serializedInstructionData = borsh.serialize(
    transferInstructionDataSchema,
    instructionData
  )

  const { signature, recoveryId } = SolanaUtils.signBytes(Buffer.from(serializedInstructionData), senderEthPrivateKey)

  const secpTransactionInstruction = Secp256k1Program.createInstructionWithPublicKey({
    publicKey: Buffer.from(ethPubkey),
    message: Buffer.from(serializedInstructionData),
    signature,
    recoveryId
  })

  const ethAddressArr = SolanaUtils.ethAddressToArray(senderEthAddress)
  const transferDataInstr = Uint8Array.of(
    1,
    ...ethAddressArr
  )

  const instructions = [
    secpTransactionInstruction,
    new TransactionInstruction({
      keys: accounts,
      programId: claimableTokenProgramKey.toString(),
      data: Buffer.from(transferDataInstr)
    })
  ]
  return transactionHandler.handleTransaction(instructions, ClaimableProgramError)
}

module.exports = {
  deriveTransferNonceAccount,
  transferWAudioBalance
}
