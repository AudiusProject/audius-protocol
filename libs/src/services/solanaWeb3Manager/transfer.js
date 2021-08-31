const {
  PublicKey,
  Secp256k1Program,
  SYSVAR_INSTRUCTIONS_PUBKEY
} = require('@solana/web3.js')
const BN = require('bn.js')
const borsh = require('borsh')
const SolanaUtils = require('./utils')
const secp256k1 = require('secp256k1')

/**
 * Transfer wAUDIO between wallets on solana
 */

class TransferInstructionData {
  constructor ({
    ethAddress,
    amount
  }) {
    this.eth_address = ethAddress
    this.amount = amount
  }
}

const transferInstructionSchema = new Map([
  [
    TransferInstructionData,
    {
      kind: 'struct',
      fields: [
        ['eth_address', [20]],
        ['amount', 'u64']
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
 * @param {identityService} identityService
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
  claimableTokenProgramKey,
  connection,
  identityService
}) {
  const strippedEthAddress = senderEthAddress.replace('0x', '')

  const ethAddressArr = Uint8Array.of(
    ...new BN(strippedEthAddress, 'hex').toArray('be')
  )

  const senderSolanaPubkey = new PublicKey(senderSolanaAddress)
  const recipientPubkey = new PublicKey(recipientSolanaAddress)
  const { signature, recoveryId } = SolanaUtils.signBytes(recipientPubkey.toBytes(), senderEthPrivateKey)

  const instructionData = new TransferInstructionData({
    ethAddress: ethAddressArr,
    amount
  })

  const serializedInstructionData = borsh.serialize(
    transferInstructionSchema,
    instructionData
  )

  const serializedInstructionEnum = Uint8Array.of(
    1,
    ...serializedInstructionData
  )

  const accounts = [
    // 0. `[w]` Token acc from which tokens will be send (bank account)
    {
      pubkey: senderSolanaPubkey,
      isSigner: false,
      isWritable: true
    },
    // 1. `[w]` Receiver token acc
    {
      pubkey: recipientPubkey,
      isSigner: false,
      isWritable: true
    },
    // 2. `[r]` Banks token account authority
    {
      pubkey: claimableTokenPDA,
      isSigner: false,
      isWritable: false
    },
    // 3. `[r]` Sysvar instruction id
    {
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    // 4. `[r]` SPL token account id
    {
      pubkey: solanaTokenProgramKey,
      isSigner: false,
      isWritable: false
    }
  ]

  // eth pubkey is different from the ethAddress - addresses are len 20, pub keys are len 64
  const ethPubkey = secp256k1.publicKeyCreate(ethPrivateKeyArr, false).slice(1)
  const { blockhash } = await connection.getRecentBlockhash()
  const secpTransactionInstruction = Secp256k1Program.createInstructionWithPublicKey({
    publicKey: Buffer.from(ethPubkey),
    message: recipientPubkey.toBytes(),
    signature,
    recoveryId,
  })

  const transactionData = {
    recentBlockhash: blockhash,
    instructions: [{
      programId: secpTransactionInstruction.programId.toString(),
      data: secpTransactionInstruction.data,
      keys: secpTransactionInstruction.keys.map(account => ({
        pubkey: account.pubkey.toString(),
        isSigner: account.isSigner,
        isWritable: account.isWritable
      }))
    }, {
      keys: accounts.map(account => {
        return {
          pubkey: account.pubkey.toString(),
          isSigner: account.isSigner,
          isWritable: account.isWritable
        }
      }),
      programId: claimableTokenProgramKey.toString(),
      data: Buffer.from(serializedInstructionEnum)
    }]
  }

  const response = await identityService.solanaRelay(transactionData)
  return response
}

module.exports = {
  transferWAudioBalance
}
