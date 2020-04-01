const DelegateManager = artifacts.require('DelegateManager')
const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')
const claimFactoryKey = web3.utils.utf8ToHex('ClaimFactory')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    let registry = await Registry.deployed()
    let audiusToken = await AudiusToken.at(AudiusToken.address)

    // Deploy DelegateManager
    await deployer.deploy(
      DelegateManager,
      audiusToken.address,
      registry.address,
      ownedUpgradeabilityProxyKey,
      serviceProviderFactoryKey,
      claimFactoryKey)
  })
}
