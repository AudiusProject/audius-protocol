import { createSenderInstruction, ethAddress } from '@audius/spl'

import {
  VersionedTransaction,
  TransactionMessage,
  Connection,
  Keypair,
  PublicKey,
  Secp256k1Program
} from '@solana/web3.js'
import keccak256 from 'keccak256'
import secp256k1 from 'secp256k1'

import { program } from 'commander'

import process from 'process'

if (!process.env.SOLANA_OWNER_SECRET_KEY) {
  throw new Error('SOLANA_OWNER_SECRET_KEY not set')
}
const owner = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.SOLANA_OWNER_SECRET_KEY))
)

if (!process.env.SOLANA_FEEPAYER_SECRET_KEY) {
  throw new Error('SOLANA_FEEPAYER_SECRET_KEY not set')
}
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.SOLANA_FEEPAYER_SECRET_KEY))
)

if (!process.env.SOLANA_REWARD_MANAGER_PDA_PUBLIC_KEY) {
  throw new Error('SOLANA_REWARD_MANAGER_PDA_PUBLIC_KEY not set')
}
const rewardManager = new PublicKey(
  process.env.SOLANA_REWARD_MANAGER_PDA_PUBLIC_KEY
)

if (!process.env.SOLANA_REWARD_MANAGER_PUBLIC_KEY) {
  throw new Error('SOLANA_REWARD_MANAGER_PUBLIC_KEY not set')
}
const rewardManagerProgramId = new PublicKey(
  process.env.SOLANA_REWARD_MANAGER_PUBLIC_KEY
)

const main = async (id: number) => {
  const connection = new Connection(
    'http://audius-protocol-solana-test-validator-1:8899'
  )

  // Get senderEthAddress
  const senderEthAddress = process.env[`DP${id}_DELEGATE_OWNER_ADDRESS`]
  if (!senderEthAddress) {
    throw new Error(`DP${id}_DELEGATE_OWNER_ADDRESS not set`)
  }
  const senderEthPrivateKey = process.env[`DP${id}_DELEGATE_OWNER_PRIVATE_KEY`]
  if (!senderEthPrivateKey) {
    throw new Error(`DP${id}_DELEGATE_OWNER_PRIVATE_KEY not set`)
  }

  // Derive authority
  const [authority] = PublicKey.findProgramAddressSync(
    [rewardManager.toBytes().slice(0, 32)],
    rewardManagerProgramId
  )

  // Derive sender
  const senderEthBuffer = Buffer.alloc(ethAddress().span)
  ethAddress().encode(senderEthAddress, senderEthBuffer)
  const [sender] = PublicKey.findProgramAddressSync(
    [
      authority.toBytes().slice(0, 32),
      Uint8Array.from([...new TextEncoder().encode('S_'), ...senderEthBuffer])
    ],
    rewardManagerProgramId
  )

  const createSender = createSenderInstruction(
    senderEthAddress,
    senderEthAddress,
    rewardManager,
    owner.publicKey,
    authority,
    payer.publicKey,
    sender,
    rewardManagerProgramId
  )

  const signResult = secp256k1.ecdsaSign(
    Uint8Array.from(keccak256(Buffer.from(createSender.data))),
    Buffer.from(senderEthPrivateKey, 'hex')
  )
  const secpInstruction = Secp256k1Program.createInstructionWithEthAddress({
    ethAddress: senderEthAddress,
    message: Buffer.from(createSender.data),
    signature: signResult.signature,
    recoveryId: signResult.recid
  })

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash()

  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: [secpInstruction, createSender]
  }).compileToLegacyMessage()
  const tx = new VersionedTransaction(message)
  tx.sign([payer, owner])
  const signature = await connection.sendTransaction(tx)
  console.log('CreateSender transaction sent:', signature)
}

program.parse()

main(Number.parseInt(program.args[0]))
