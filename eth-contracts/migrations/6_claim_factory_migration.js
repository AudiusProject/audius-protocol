const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const ClaimFactory = artifacts.require('ClaimFactory')

const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const claimFactoryKey = web3.utils.utf8ToHex('ClaimFactory')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const token = await AudiusToken.deployed()
    const registry = await Registry.deployed()

    // Deploy new ClaimFactory
    const claimFactory = await deployer.deploy(
      ClaimFactory,
      token.address,
      registry.address,
      stakingProxyKey,
      serviceProviderFactoryKey,
      { from: accounts[0] }
    )

    // Register ClaimFactory
    await registry.addContract(claimFactoryKey, claimFactory.address, { from: accounts[0] })

    // Register ClaimFactory as minter
    // Note that by default this is called from accounts[0] in ganache
    // During an actual migration, this step should be run independently
    const tokenDeployerAcct = accounts[0]
    await token.addMinter(claimFactory.address, { from: tokenDeployerAcct })
  })
}
