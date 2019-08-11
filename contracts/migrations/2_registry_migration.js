const Registry = artifacts.require('Registry')

module.exports = (deployer) => {
  deployer.then(async () => {
    await deployer.deploy(Registry)
  })
}
