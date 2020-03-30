const AudiusToken = artifacts.require('AudiusToken')
const ClaimFactory = artifacts.require('ClaimFactory')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const Registry = artifacts.require('Registry')
const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    let proxy = await OwnedUpgradeabilityProxy.deployed()
    let registry = await Registry.deployed()
    let stakingAddress = proxy.address

    // Deploy new ClaimFactory
    await deployer.deploy(
      ClaimFactory,
      AudiusToken.address,
      registry.address,
      ownedUpgradeabilityProxyKey)

    let claimFactory = await ClaimFactory.deployed()

    // Replace AudiusToken artifact with AudiusToken.at('0x...') if needed
    let audiusToken = await AudiusToken.at(AudiusToken.address)

    // Register ClaimFactory as minter
    // Note that by default this is called from accounts[0] in ganache
    // During an actual migration, this step should be run independently
    let tokenDeployerAcct = accounts[0]
    await audiusToken.addMinter(claimFactory.address, { from: tokenDeployerAcct })
  })
}
