const contractConfig = require('../contract-config.js')

const Registry = artifacts.require('Registry')

const UserReplicaSetManager = artifacts.require('UserReplicaSetManager')
const userFactoryKey = web3.utils.utf8ToHex('UserFactory')
const userReplicaSetManagerKey = web3.utils.utf8ToHex('UserReplicaSetManager')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
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
