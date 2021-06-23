const {
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY
} = require('@solana/web3.js')
const BN = require('bn.js')
const borsh = require('borsh')
const keccak256 = require('keccak256')
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

// transferWAudioBalance transfers wrapped Audio from one generated solana account to another.
// For it to work, you have to have the eth private key belonging to the eth public key
// that generated the solana account
async function transferWAudioBalance (
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
) {
  const strippedEthAddress = senderEthAddress.replace('0x', '')

  const ethAddressArr = Uint8Array.of(
    ...new BN(strippedEthAddress, 'hex').toArray('be')
  )

  const ethPrivateKeyArr = Buffer.from(senderEthPrivateKey, 'hex')

  const senderSolanaPubkey = new PublicKey(senderSolanaAddress)
  const recipientPubkey = new PublicKey(recipientSolanaAddress)

  // hash the recipient solana pubkey and create signature
  const msgHash = keccak256(recipientPubkey.toBytes())
  const signatureObj = secp256k1.ecdsaSign(
    Uint8Array.from(msgHash),
    ethPrivateKeyArr
  )

  const instructionData = new TransferInstructionData({
    ethAddress: ethAddressArr,
    amount
  })

  // serialize it
  const serializedInstructionData = borsh.serialize(
    transferInstructionSchema,
    instructionData
  )

  // give it the rust enum tag
  // we can do this better all with borsh - look in
  // identity or ask cheran
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

  const transactionData = {
    recentBlockhash: blockhash,
    secpInstruction: {
      publicKey: Buffer.from(ethPubkey),
      message: recipientPubkey.toString(),
      signature: Buffer.from(signatureObj.signature),
      recoveryId: signatureObj.recid
    },
    instruction: {
      keys: accounts.map(account => {
        return {
          pubkey: account.pubkey.toString(),
          isSigner: account.isSigner,
          isWritable: account.isWritable
        }
      }),
      programId: claimableTokenProgramKey.toString(),
      data: Buffer.from(serializedInstructionEnum)
    }
  }

  const response = await identityService.solanaRelay(transactionData)
  return response
}

module.exports = {
  transferWAudioBalance
}
