const Migrations = artifacts.require('./Migrations.sol')

module.exports = (deployer) => {
  deployer.then(async () => {
    await deployer.deploy(Migrations)
  })
}
