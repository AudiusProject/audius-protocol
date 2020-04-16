const Registry = artifacts.require('Registry')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    await deployer.deploy(Registry, { from: accounts[0] })
  })
}
