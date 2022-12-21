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

    const inProgressIds = await audiusLibs.ethContracts.GovernanceClient.getInProgressProposals()
    console.log(`Found ${inProgressIds.length} in progress proposals: ${inProgressIds}`)

    for (const proposalId of inProgressIds) {
        console.log(`Evaluating proposal: ${proposalId}`)

        try {
            const txReceipt = await audiusLibs.ethContracts.GovernanceClient.evaluateProposalOutcome(
                proposalId
            )

            console.log(txReceipt)
            console.log(JSON.stringify(txReceipt))

            // TODO: Determine if proposal was evaluated as expected
            // if (txReceipt.logs[0].event == 'ProposalOutcomeEvaluated') {
            //     console.log(`ProposalOutcomeEvaluated: ${proposalId}`)
            // } else {
            //     console.error(`Proposal ${proposalId} outcome: ${txReceipt}.`)
            // }
        } catch (e) {
            console.error(`Error evaluating proposal: ${proposalId}`)
            console.error(e.stack)
        }
    }
    console.log('done.')
    process.exit(0)
}

main()
