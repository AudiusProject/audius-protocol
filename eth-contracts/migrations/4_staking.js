const abi = require('ethereumjs-abi')
const contractConfig = require('../contract-config.js')

const Staking = artifacts.require('Staking')
const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')

const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')
const claimFactoryKey = web3.utils.utf8ToHex('ClaimFactory')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')

function encodeCall (name, args, values) {
  const methodId = abi.methodID(name, args).toString('hex')
  const params = abi.rawEncode(args, values).toString('hex')
  return '0x' + methodId + params
}

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    let registry = await Registry.deployed()
    // const networkId = Registry.network_id
    const config = contractConfig[network]
    const treasuryAddress = config.treasuryAddress || accounts[0]

    const token = await AudiusToken.deployed()
    let staking = await deployer.deploy(Staking)
    let ownedUpgradeabilityProxy = await deployer.deploy(OwnedUpgradeabilityProxy)

    // Register proxy for access by service provider factory
    await registry.addContract(
      ownedUpgradeabilityProxyKey,
      ownedUpgradeabilityProxy.address)

    // Encode data for the call to initialize
    let initializeData = encodeCall(
      'initialize',
      [
        'address',
        'address',
        'address',
        'bytes32',
        'bytes32',
        'bytes32'
      ],
      [
        token.address,
        treasuryAddress,
        registry.address,
        claimFactoryKey,
        delegateManagerKey,
        serviceProviderFactoryKey
      ])

    let contractDeployer = accounts[0]

    // Initialize staking proxy
    await ownedUpgradeabilityProxy.upgradeToAndCall(
      staking.address,
      initializeData,
      { from: contractDeployer })
  })
}
