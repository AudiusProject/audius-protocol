const borsh = require('borsh')
const Web3 = require('web3')
const BN = require('bn.js')
const solanaWeb3 = require('@solana/web3.js')
const {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction
} = solanaWeb3
/// Sender program account seed
const SENDER_SEED_PREFIX = 'S_'
const encoder = new TextEncoder()
const getEnv = env => {
  const value = process.env[env]
  if (typeof value === 'undefined') {
    console.log(`${env} has not been set.`)
    return null
  }
  return value
}

const ethAddressToArr = ethAddress => {
  const strippedEthAddress = ethAddress.replace('0x', '')
  return Uint8Array.of(...new BN(strippedEthAddress, 'hex').toArray('be'))
}

const findProgramAddress = (programId, pubkey) => {
  return PublicKey.findProgramAddress(
    [pubkey.toBytes().slice(0, 32)],
    programId
  )
}

// Finds a 'derived' address by finding a programAddress with
// seeds array  as first 32 bytes of base + seeds
// Returns [derivedAddress, bumpSeed]
const findDerivedAddress = (programId, base, seed) => {
  return PublicKey.findProgramAddress(
    [base.toBytes().slice(0, 32), seed],
    programId
  )
}

const findDerivedPair = async (programId, rewardManager, seed) => {
  // Finds the rewardManagerAuthority account by generating
  // a PDA with the rewardsMnager as a seed
  const [rewardManagerAuthority] = await findProgramAddress(
    programId,
    rewardManager
  )
  const [derivedAddress, bumpSeed] = await findDerivedAddress(
    programId,
    rewardManagerAuthority,
    seed
  )
  return [rewardManagerAuthority, derivedAddress, bumpSeed]
}

class CreateSenderInstructionData {
  constructor({ eth_address, operator }) {
    ;(this.eth_address = eth_address), (this.operator = operator)
  }
}

const createSenderInstructionSchema = new Map([
  [
    CreateSenderInstructionData,
    {
      kind: 'struct',
      fields: [
        ['eth_address', [20]],
        ['operator', [20]]
      ]
    }
  ]
])

const createSenderLocal = async ethAddress => {
  const protocolDir = getEnv('PROTOCOL_DIR')
  const solanaConfig = require(`${protocolDir}/solana-programs/solana-program-config.json`)
  const ownerWalletBytes = solanaConfig.ownerWallet
  const feepayerWalletBytes = solanaConfig.feePayerWallet
  const connection = new solanaWeb3.Connection('http://localhost:8899')

  // Log in as current owner wallet
  const ownerWalletKeypair = Keypair.fromSecretKey(
    new Uint8Array(ownerWalletBytes)
  )
  const ownerWalletPubkey = ownerWalletKeypair.publicKey

  const feepayerWalletKeypair = Keypair.fromSecretKey(
    new Uint8Array(feepayerWalletBytes)
  )
  const feepayerWalletPubkey = feepayerWalletKeypair.publicKey

  const ethArr1 = ethAddressToArr(ethAddress)

  const rewardProgramId = new PublicKey(solanaConfig.rewardsManagerAddress)
  const rewardManagerAccount = new PublicKey(solanaConfig.rewardsManagerAccount)

  const [rewardManagerAuthority, derivedSenderAddress] = await findDerivedPair(
    rewardProgramId,
    rewardManagerAccount,
    Uint8Array.from([...encoder.encode(SENDER_SEED_PREFIX), ...ethArr1])
  )

  console.log(`OwnerWallet: ${ownerWalletPubkey}`)
  console.log(`FeePayer: ${feepayerWalletPubkey}`)
  console.log(`SystemProgram: ${SystemProgram.programId}`)
  console.log(`Rent ID: ${SYSVAR_RENT_PUBKEY}`)
  console.log(`RewardManager Program Id: ${rewardProgramId}`)
  console.log(`RewardManager Derived Authority: ${rewardManagerAuthority}`)
  console.log(`Derived sender address: ${derivedSenderAddress}`)

  ///   0. `[]`  RewardManager
  ///   1. `[]`  RewardManager Manager Account
  ///   2. `[]`  RewardManagerAuthority (derived)
  ///   2. `[w]` Feepayer
  ///   2. `[w]` Derived sender address
  ///   2. `[]`  System program
  const accounts = [
    {
      pubkey: rewardManagerAccount,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: ownerWalletPubkey,
      isSigner: true,
      isWritable: false
    },
    {
      pubkey: rewardManagerAuthority,
      isSigner: false,
      isWritable: true
    },
    {
      pubkey: feepayerWalletPubkey,
      isSigner: true,
      isWritable: true
    },
    {
      pubkey: derivedSenderAddress,
      isSigner: false,
      isWritable: true
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    }
  ]

  const createSenderInstructionData = new CreateSenderInstructionData({
    eth_address: ethArr1,
    operator: ethArr1
  })
  const serializedInstructionData = borsh.serialize(
    createSenderInstructionSchema,
    createSenderInstructionData
  )
  const serializedInstructionEnum = Buffer.from(
    Uint8Array.of(2, ...serializedInstructionData)
  )

  const createSenderInstruction = new TransactionInstruction({
    keys: accounts,
    programId: rewardProgramId,
    data: serializedInstructionEnum
  })

  const { blockhash: recentBlockhash } = await connection.getRecentBlockhash()
  const transaction = new Transaction({
    feepayerWalletPubkey,
    recentBlockhash
  })
  transaction.add(createSenderInstruction)
  transaction.sign(
    {
      publicKey: feepayerWalletKeypair.publicKey,
      secretKey: feepayerWalletKeypair.secretKey
    },
    {
      publicKey: ownerWalletKeypair.publicKey,
      secretKey: ownerWalletKeypair.secretKey
    }
  )

  try {
    const transactionSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [
        {
          publicKey: feepayerWalletKeypair.publicKey,
          secretKey: feepayerWalletKeypair.secretKey
        },
        {
          publicKey: ownerWalletKeypair.publicKey,
          secretKey: ownerWalletKeypair.secretKey
        }
      ],
      {
        skipPreflight: false,
        commitment: 'processed',
        preflightCommitment: 'processed'
      }
    )
    console.log(`Registered ${ethAddress}, txhash=${transactionSignature}`)
  } catch (e) {
    console.error('SENT BUT ERROR')
    console.error(e.message)
    console.log({ e })
  }
}

const findEthAddressForDiscProvAndRegister = async serviceNumber => {
  const ethWeb3 = new Web3(
    new Web3.providers.HttpProvider('http://localhost:8546')
  )
  const ethAccounts = await ethWeb3.eth.getAccounts()
  console.log(`Finding address for disc prov #${serviceNumber}`)
  const accountIndex = 8 + parseInt(serviceNumber)
  console.log(`Account index = ${accountIndex}`)
  const discProvAccount = ethAccounts[accountIndex]
  console.log(`Eth address for disc prov #${serviceNumber}=${discProvAccount}`)
  await createSenderLocal(discProvAccount)
}

const args = process.argv
const run = async () => {
  try {
    switch (args[2]) {
      case 'register-discprov':
        const serviceCount = args[3]
        console.log(`RewardManager | Registering disc prov ${serviceCount}`)
        await findEthAddressForDiscProvAndRegister(serviceCount)
        console.log(
          `RewardManager | Finished registering disc prov ${serviceCount}`
        )
        break
      case 'register-eth-address':
        const ethAddress = args[3]
        console.log(`RewardManager | Registering eth address ${ethAddress}`)
        await createSenderLocal(ethAddress)
        console.log(
          `RewardManager | Finished registering eth address ${ethAddress}`
        )
        break
      default:
        throw new Error('Invalid argument found')
    }
  } catch (e) {
    console.log(e)
  }
}

run()
