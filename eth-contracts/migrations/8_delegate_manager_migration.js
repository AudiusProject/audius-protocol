const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const Governance = artifacts.require('Governance')
const DelegateManager = artifacts.require('DelegateManager')

const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const governanceKey = web3.utils.utf8ToHex('Governance')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const token = await AudiusToken.deployed()
    const registry = await Registry.deployed()

    // Deploy DelegateManager
    const delegateManager = await deployer.deploy(
      DelegateManager,
      token.address,
      registry.address,
      governanceKey,
      stakingProxyKey,
      serviceProviderFactoryKey,
      claimsManagerProxyKey,
      { from: accounts[0] }
    )

    await registry.addContract(delegateManagerKey, delegateManager.address, { from: accounts[0] })
  })
}
