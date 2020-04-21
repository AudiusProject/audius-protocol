const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const ClaimFactory = artifacts.require('ClaimFactory')

const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const claimFactoryKey = web3.utils.utf8ToHex('ClaimFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const token = await AudiusToken.deployed()
    const registry = await Registry.deployed()
    const tokenDeployerAcct = accounts[0]

    // Deploy new ClaimFactory
    let claimFactory = await deployer.deploy(
      ClaimFactory,
      token.address,
      registry.address,
      stakingProxyKey,
      serviceProviderFactoryKey,
      delegateManagerKey)

    claimFactory = await ClaimFactory.deployed()

    // Register ClaimFactory
    await registry.addContract(claimFactoryKey, claimFactory.address, { from: accounts[0] })

    // Register ClaimFactory as minter
    // Note that by default this is called from accounts[0] in ganache
    // During an actual migration, this step should be run independently
    await token.addMinter(claimFactory.address, { from: tokenDeployerAcct })
  })
}
