const { libs } = require('@audius/sdk')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const Web3 = require('web3')

const localKeyProvider = new HDWalletProvider({
    privateKeys: [process.env.OWNER_PRIVATE_KEY],
    providerOrUrl: process.env.ETH_PROVIDER_ENDPOINT,
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

const main = async () => {
    await audiusLibs.init()
    const web3 = audiusLibs.ethWeb3Manager.getWeb3()

    const targetContractRegistryKey = web3.utils.utf8ToHex('ServiceTypeManagerProxy')
    const callValue = 0
    const functionSignature = 'slash(uint256,address)'

    const callData = [`${web3.utils.utf8ToHex(process.env.SLASH_AMOUNT)}`, process.env.SLASH_ADDRESS]
    const name = `Slash ${process.env.SLASH_ADDRESS} for SLA breaches`
    const description = `Slash ${process.env.SLASH_ADDRESS} by ${process.env.SLASH_AMOUNT} $AUDIO for SLA breaches.\n\n${process.env.ADDITIONAL_NOTES}`

    console.log(`Slashing ${process.env.SLASH_ADDRESS} by ${process.env.SLASH_AMOUNT}`)
    const proposalId = await audiusLibs.ethContracts.GovernanceClient.submitProposal({
        targetContractRegistryKey, callValue, functionSignature, callData, name, description
    })
    console.log(`Created proposal for ${functionSignature} against ${process.env.SLASH_ADDRESS}`)
    console.log('done.')
    process.exit(0)

    // We don't vote, but this is how we would do it if we wanted to
    // await audiusLibs.ethContracts.GovernanceClient.submitVote({
    //   proposalId,
    //   vote: audiusLibs.ethContracts.GovernanceClient.Vote.yes
    // })
}

main()
