const { libs } = require('../../packages/libs')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const Web3 = require('web3')

const localKeyProvider = new HDWalletProvider({
  privateKeys: [process.env.OWNER_PRIVATE_KEY],
  providerOrUrl: process.env.ETH_PROVIDER_ENDPOINT
})
const providers = [new Web3(localKeyProvider)]

const audiusLibs = new libs({
  ethWeb3Config: libs.configEthWeb3(
    process.env.ETH_TOKEN_ADDRESS,
    process.env.ETH_REGISTRY_ADDRESS,
    providers,
    process.env.OWNER_WALLET
  ),
  isServer: true,
  enableUserReplicaSetManagerContract: true
})

// import from audiusLibs.ethContracts.GovernanceClient.Vote
const Vote = Object.freeze({
  no: 1,
  yes: 2
})

const main = async () => {
  await audiusLibs.init()
  const web3 = audiusLibs.ethWeb3Manager.getWeb3()

  const targetContractRegistryKey = web3.utils.utf8ToHex(
    'ServiceTypeManagerProxy'
  )
  const callValue = 0
  const functionSignature = 'setServiceVersion(bytes32,bytes32)'

  const serviceNames = [
    {
      new_name: 'discovery-node',
      legacy_name: 'discovery-provider'
    },
    {
      new_name: 'content-node',
      legacy_name: 'creator-node'
    }
  ]

  const proposalIds = []
  for (let serviceName of serviceNames) {
    const callData = [
      `${web3.utils.utf8ToHex(serviceName.new_name)}`,
      `${web3.utils.utf8ToHex(process.env.RELEASE_VERSION)}`
    ]
    const name = `Set latest ${serviceName.new_name} version on chain to v${process.env.RELEASE_VERSION}`
    let url = 'https://github.com/AudiusProject/audius-protocol/releases/tag/'
    url += encodeURIComponent(
      `@audius/${serviceName.legacy_name}@${process.env.RELEASE_VERSION}`
    )

    const description = `Git SHA - ${process.env.RELEASE_HASH}.\nLink to release - ${url}.\n\n${process.env.ADDITIONAL_NOTES}`

    const proposalId =
      await audiusLibs.ethContracts.GovernanceClient.submitProposal({
        targetContractRegistryKey,
        callValue,
        functionSignature,
        callData,
        name,
        description
      })
    console.log(
      `Created ${serviceName.new_name} proposal for ${functionSignature}: ${proposalId}`
    )

    proposalIds.push(proposalId)
  }

  for (let proposalId of proposalIds) {
    console.log(`Voting on proposal ${proposalId} for ${functionSignature}...`)
    await audiusLibs.ethContracts.GovernanceClient.submitVote({
      proposalId,
      vote: Vote.yes
    })
    console.log(`Voted on proposal ${proposalId} for ${functionSignature}.`)
  }
  console.log('done.')
  process.exit(0)
}

main()
