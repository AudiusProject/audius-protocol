import { RewardManagerProgram, Secp256k1Program } from '@audius/spl'
import { PublicKey, type TransactionInstruction } from '@solana/web3.js'
import {
  Configuration,
  SolanaClient,
  SolanaRelay,
  SolanaRelayWalletAdapter
} from '@audius/sdk'

const endpoints = [
  'https://discoveryprovider.staging.audius.co',
  'https://discoveryprovider2.staging.audius.co',
  'https://discoveryprovider3.staging.audius.co'
]

const programId = new PublicKey('CDpzvz7DfgbF95jSSCHLX3ERkugyfgn9Fw8ypNZ1hfXp')
const rewardManagerState = new PublicKey(
  'GaiG9LDYHfZGqeNaoGRzFEnLiwUT7WiC6sA6FDJX9ZPq'
)
const authority = RewardManagerProgram.deriveAuthority({
  programId,
  rewardManagerState
})

const client = new SolanaClient({
  solanaWalletAdapter: new SolanaRelayWalletAdapter({
    solanaRelay: new SolanaRelay(new Configuration({ basePath: endpoints[0] }))
  })
})

const createSenderPublicInstructions = async ({
  senderEthAddress,
  operatorEthAddress,
  attestations
}: {
  senderEthAddress: string
  operatorEthAddress: string
  attestations: any[]
}) => {
  const instructions: TransactionInstruction[] = []
  const existingSenders: PublicKey[] = []

  const sender = RewardManagerProgram.deriveSender({
    ethAddress: senderEthAddress,
    programId,
    authority
  })

  for (let i = 0; i < attestations.length; i++) {
    const data = attestations[i]

    const message = RewardManagerProgram.encodeSenderAttestation({
      senderEthAddress,
      authority
    })

    let stripped = data.attestation.replace('0x', '')
    if (stripped.length % 2 != 0) {
      stripped = '0' + stripped
    }
    const signature = Buffer.alloc(65)
    const attestationBytes = Buffer.from(stripped, 'hex')
    attestationBytes.copy(signature, signature.length - attestationBytes.length)
    const secpInstruction = Secp256k1Program.createInstructionWithEthAddress({
      ethAddress: data.owner_wallet,
      message,
      signature: signature.subarray(0, 64),
      recoveryId: signature[64],
      instructionIndex: instructions.length
    })
    instructions.push(secpInstruction)
  }
  const payer = await client.getFeePayer()
  const createSenderInst = RewardManagerProgram.createSenderPublicInstruction({
    senderEthAddress,
    operatorEthAddress,
    sender,
    existingSenders,
    rewardManagerState,
    authority,
    payer,
    rewardManagerProgramId: programId
  })
  instructions.push(createSenderInst)
  return instructions
}

const createContentNodeSenders = async () => {
  const {
    data: {
      network: { content_nodes: contentNodes }
    }
  } = await fetch(endpoints[0] + '/health_check').then((r) => r.json())

  for (const contentNode of contentNodes) {
    const senderEthAddress = contentNode.delegateOwnerWallet
    const {
      data: { spOwnerWallet: operatorEthAddress }
    } = await fetch(contentNode.endpoint + '/health_check').then((r) =>
      r.json()
    )

    const attestations = await Promise.all(
      endpoints.map(async (e) => {
        const res = await fetch(
          `${e}/v1/challenges/attest_sender?sender_eth_address=${senderEthAddress}`
        )
        const json = await res.json()
        return json
      })
    )

    const instructions = await createSenderPublicInstructions({
      senderEthAddress,
      operatorEthAddress,
      attestations
    })

    const tx = await client.buildTransaction({
      instructions
    })
    await client.sendTransaction(tx)
  }
}

createContentNodeSenders()
