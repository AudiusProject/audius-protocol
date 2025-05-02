import { RewardManagerProgram, ethAddress } from '@audius/spl'

import {
  VersionedTransaction,
  TransactionMessage,
  Connection,
  Keypair,
  PublicKey
} from '@solana/web3.js'

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

const main = async (serviceType: string, id: number) => {
  const connection = new Connection(
    'http://audius-protocol-solana-test-validator-1:8899'
  )

  // Get senderEthAddress
  const senderAddressEnvKey =
    serviceType === 'content-node'
      ? `CN${id}_SP_OWNER_ADDRESS`
      : serviceType === 'aao'
        ? `AAO_WALLET_ADDRESS`
        : `DP${id}_DELEGATE_OWNER_ADDRESS`
  const senderPrivateKeyEnvKey =
    serviceType === 'content-node'
      ? `CN${id}_SP_OWNER_PRIVATE_KEY`
      : serviceType === 'aao'
        ? `AAO_WALLET_PRIVATE_KEY`
        : `DP${id}_DELEGATE_OWNER_PRIVATE_KEY`
  const senderEthAddress = process.env[senderAddressEnvKey]
  if (!senderEthAddress) {
    throw new Error(`${senderAddressEnvKey} not set`)
  }
  const senderEthPrivateKey = process.env[senderPrivateKeyEnvKey]
  if (!senderEthPrivateKey) {
    throw new Error(`${senderPrivateKeyEnvKey} not set`)
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

  const createSender = RewardManagerProgram.createSenderInstruction({
    senderEthAddress,
    operatorEthAddress: senderEthAddress,
    rewardManagerState: rewardManager,
    manager: owner.publicKey,
    authority,
    payer: payer.publicKey,
    sender,
    rewardManagerProgramId
  })

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash()

  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: [createSender]
  }).compileToLegacyMessage()
  const tx = new VersionedTransaction(message)
  tx.sign([payer, owner])
  const signature = await connection.sendTransaction(tx)
  console.log('CreateSender transaction sent:', signature)
}

program.parse()

main(program.args[0], Number.parseInt(program.args[1]))
