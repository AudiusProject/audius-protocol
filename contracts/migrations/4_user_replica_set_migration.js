const contractConfig = require('../contract-config.js')
const Registry = artifacts.require('Registry')
const UserReplicaSetManager = artifacts.require('UserReplicaSetManager')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')
const userFactoryKey = web3.utils.utf8ToHex('UserFactory')
const userReplicaSetManagerKeyString = 'UserReplicaSetManager'
const userReplicaSetManagerKey = web3.utils.utf8ToHex(userReplicaSetManagerKeyString)
const abi = require('ethereumjs-abi')

// Generate encoded arguments for proxy initialization
const encodeCall = (name, args, values) => {
  const methodId = abi.methodID(name, args).toString('hex')
  const params = abi.rawEncode(args, values).toString('hex')
  return '0x' + methodId + params
}

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    let registry
    let registryAddress
    if (network === 'test_local' || network === 'development') {
      registry = await Registry.deployed()
      registryAddress = registry.address
    } else {
      if (!config.registryAddress) {
        throw new Error('Invalid configuration, expected registry address to be configured')
      }
      registryAddress = config.registryAddress
      registry = await Registry.at(registryAddress)
    }

    const networkId = Registry.network_id
    console.log(`Deploying UserReplicaSetManager to ${network}`)
    // This is the blacklist's veriferAddress
    // Incoming proxy admin is identical to currently configured blacklisterAddress
    // If no blacklister is configured, the last known account is used as the proxy admin
    const proxyAdminAddress = config.blacklisterAddress || accounts[accounts.length - 1]
    const userReplicaSetBootstrapAddress = config.userReplicaSetBootstrapAddress || accounts[9]

    const bootstrapSPIds = config.bootstrapSPIds
    const bootstrapNodeDelegateWallets = config.bootstrapSPDelegateWallets
    const bootstrapSPOwnerWallets = config.bootstrapSPOwnerWallets
    const invalidBootstrapConfiguration = (bootstrapSPIds.length === 0 || bootstrapNodeDelegateWallets.length === 0 || bootstrapSPOwnerWallets.length === 0)
    if (
        (network !== 'test_local' && network !== 'development') &&
        (invalidBootstrapConfiguration)
      ) {
      throw new Error(
        `UserReplicaSetManager Migration: Invalid configuration provided. Received bootstrapSPIds=${bootstrapSPIds}, bootstrapNodeDelegateWallets=${bootstrapNodeDelegateWallets}, bootstrapSPOwnerWallets=${bootstrapSPOwnerWallets}`
      )
    } else if (invalidBootstrapConfiguration) {
      console.error(`WARNING UserReplicaSetManager Migration: Proceeding with Invalid Bootstrap configuration. Received bootstrapSPIds=${bootstrapSPIds}, bootstrapNodeDelegateWallets=${bootstrapNodeDelegateWallets}, bootstrapSPOwnerWallets=${bootstrapSPOwnerWallets}`)
    }

    console.log(`Configuration provided. Deploying with ${bootstrapSPIds} and ${bootstrapNodeDelegateWallets}`)

    // Deploy logic contract
    let deployLogicTx = await deployer.deploy(UserReplicaSetManager)
    let logicContractAddress = deployLogicTx.address
    const initializeUserReplicaSetManagerCalldata = encodeCall(
        'initialize',
        [
            'address',
            'bytes32',
            'address',
            'uint'
        ],
        [
          registryAddress,
          userFactoryKey,
          userReplicaSetBootstrapAddress,
          networkId
        ]
    )
    // Deploy proxy contract with encoded initialize function
    let deployedProxyTx = await deployer.deploy(
      AdminUpgradeabilityProxy,
      logicContractAddress,
      proxyAdminAddress,
      initializeUserReplicaSetManagerCalldata
    )
    let userReplicaSetManagerProxyAddress = deployedProxyTx.address
    console.log(`UserReplicaSetManager Proxy Contract deployed at ${deployedProxyTx.address}`)
    // Register proxy contract against Registry
    await registry.addContract(userReplicaSetManagerKey, userReplicaSetManagerProxyAddress)
    // Confirm registered address matches proxy
    let retrievedAddressFromRegistry = await registry.getContract(userReplicaSetManagerKey)
    console.log(`Registered ${retrievedAddressFromRegistry} with key ${userReplicaSetManagerKeyString}/${userReplicaSetManagerKey}`)

    // Confirm seed is not yet complete
    let userReplicaSetManagerInst = await UserReplicaSetManager.at(deployedProxyTx.address)
    let seedComplete = await userReplicaSetManagerInst.getSeedComplete({ from: userReplicaSetBootstrapAddress })
    console.log(`Seed complete: ${seedComplete}`)
    // Issue seed operation
    // Note - seedBootstrapNodes MUST be called from userReplicaBootstrapAddress
    await userReplicaSetManagerInst.seedBootstrapNodes(
      bootstrapSPIds,
      bootstrapNodeDelegateWallets,
      bootstrapSPOwnerWallets,
      { from: userReplicaSetBootstrapAddress }
    )
    seedComplete = await userReplicaSetManagerInst.getSeedComplete({ from: userReplicaSetBootstrapAddress })
    console.log(`Seed complete: ${seedComplete}`)
  })
}
