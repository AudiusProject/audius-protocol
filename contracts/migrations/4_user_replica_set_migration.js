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
    // TODO: Consider how this migration will be run against prod
    //       Registry.deployed() may not be the cleanest way to do this
    let registry = await Registry.deployed()
    const networkId = Registry.network_id
    const registryAddress = registry.address
    console.log(`Deploying UserReplicaSetManager to ${network}`)
    const config = contractConfig[network]
    // This is the blacklist's veriferAddress
    const blacklisterAddress = config.blacklisterAddress || accounts[0]
    // Incoming proxy admin is identical to currently configured blacklisterAddress
    const proxyAdminAddress = blacklisterAddress
    const userReplicaSetBootstrapAddress = config.userReplicaSetBootstrapAddress || accounts[9]

    const bootstrapSPIds = config.bootstrapSPIds
    const bootstrapNodeDelegateWallets = config.bootstrapSPDelegateWallets
    if (network !== 'test_local' && (bootstrapSPIds.length === 0 || bootstrapNodeDelegateWallets.length == 0)) {
      throw new Error(
        `UserReplicaSetManager Migration: Invalid configuration provided. Received bootstrapSPIds=${bootstrapSPIds} and bootstrapNodeDelegateWallets=${bootstrapNodeDelegateWallets}`
      )
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
      { from: userReplicaSetBootstrapAddress }
    )
    seedComplete = await userReplicaSetManagerInst.getSeedComplete({ from: userReplicaSetBootstrapAddress })
    console.log(`Seed complete: ${seedComplete}`)

    // Register proxy contract against Registry
    await registry.addContract(userReplicaSetManagerKey, userReplicaSetManagerProxyAddress)
  })
}
