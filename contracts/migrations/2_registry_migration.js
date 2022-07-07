const Registry = artifacts.require('Registry')

module.exports = (deployer) => {
  deployer.then(async () => {
    let registryDeployTx = await deployer.deploy(Registry)
    // Set environment variable
    process.env.dataContractsRegistryAddress = registryDeployTx.address
  })
}
