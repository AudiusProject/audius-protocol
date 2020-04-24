const contractConfig = require('../contract-config.js')

const Registry = artifacts.require('Registry')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const treasuryAddress = config.treasuryAddress || accounts[0]

    const registry = await deployer.deploy(Registry, { from: treasuryAddress })
    await registry.initialize({ from: treasuryAddress })

  })
}
