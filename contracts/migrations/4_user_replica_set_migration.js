const contractConfig = require('../contract-config.js')

const Registry = artifacts.require('Registry')

const UserReplicaSetManager = artifacts.require('UserReplicaSetManager')
const userFactoryKey = web3.utils.utf8ToHex('UserFactory')
const userReplicaSetManagerKey = web3.utils.utf8ToHex('UserReplicaSetManager')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    // TODO: Consider how this migration will be run against prod
    //       Registry.deployed() is not the right way to do this
    //       A separate migration or some added logic here should handle the requirements
    let registry = await Registry.deployed()
    const registryAddress = registry.address
    const networkId = Registry.network_id
    const config = contractConfig[network]
    const nodeBootstrapAddress = config.nodeBootstrapAddress || accounts[25]
    const userReplicaSetBootstrapAddress = config.userReplicaSetBootstrapAddress || accounts[27]
    await deployer.deploy(
        UserReplicaSetManager,
        registryAddress,
        userFactoryKey,
        nodeBootstrapAddress,
        userReplicaSetBootstrapAddress,
        networkId
    )
    await registry.addContract(
        userReplicaSetManagerKey,
        UserReplicaSetManager.address
    )
  })
}
