const DelegateManager = artifacts.require('DelegateManager')
const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const Governance = artifacts.require('Governance')
const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')
const claimFactoryKey = web3.utils.utf8ToHex('ClaimFactory')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    let registry = await Registry.deployed()
    let audiusToken = await AudiusToken.at(AudiusToken.address)

    // Deploy DelegateManager
    await deployer.deploy(
      DelegateManager,
      audiusToken.address,
      registry.address,
      Governance.address,
      ownedUpgradeabilityProxyKey,
      serviceProviderFactoryKey,
      claimFactoryKey)

    let delegateManager = await DelegateManager.deployed()
    await registry.addContract(delegateManagerKey, delegateManager.address)
  })
}
