const {
  CHAIN_ID_SOLANA,
  CONTRACTS,
  getEmitterAddressSolana,
  getSignedVAAWithRetry,
  parseSequenceFromLogSolana,
  redeemOnEth
} = require('@certusone/wormhole-sdk')
const { Connection } = require('@solana/web3.js')
const { NodeHttpTransport } = require('@improbable-eng/grpc-web-node-http-transport')
const { ethers } = require('ethers')

const WORMHOLE_RPC_HOSTS = [
  'https://wormhole-v2-mainnet-api.certus.one',
  'https://wormhole.inotel.ro',
  'https://wormhole-v2-mainnet-api.mcf.rocks',
  'https://wormhole-v2-mainnet-api.chainlayer.network',
  'https://wormhole-v2-mainnet-api.staking.fund',
  'https://wormhole-v2-mainnet.01node.com',
]

const redeem = async ({
  txid,
  connection,
  signer
}) => {
  try {
    const info = await connection.getTransaction(txid, {})
    if (!info) {
      throw new Error(
        'An error occurred while fetching the transaction info'
      )
    }
    // get the sequence from the logs (needed to fetch the vaa)
    const sequence = parseSequenceFromLogSolana(info)
    const emitterAddress = getEmitterAddressSolana(
      CONTRACTS.MAINNET.solana.token_bridge
    )
    // poll until the guardian(s) witness and sign the vaa
    const { vaaBytes: signedVAA } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      CHAIN_ID_SOLANA,
      emitterAddress,
      sequence,
      {
        transport: NodeHttpTransport(),
      }
    )
    await redeemOnEth(
      CONTRACTS.MAINNET.ethereum.token_bridge,
      signer,
      signedVAA
    )
    console.log('Successfully redeemed the tokens on Ethereum!')
  } catch (e) {
    console.error(`Caught error: ${e}`)
  }
}

if (process.argv.length < 3) {
  console.error('Usage: node scripts/redeem.ts <transaction-id>')
  process.exit(1)
}

const txid = process.argv[2]
console.log(`Redeeming transaction ${txid}...`)

const endpoint = 'https://api.mainnet-beta.solana.com'
const connection = new Connection(endpoint, 'confirmed');
const provider = new ethers.providers.JsonRpcProvider(process.env.ethProviderUrl);
const signer = new ethers.Wallet(process.env.ethPrivateKey, provider);

redeem({ txid, connection, signer })
