const fs = require('fs-extra')
const path = require('path')

const contractConfig = require('../contract-config.js')

// Migration to output token and registry addresses
module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const tokenAddress = process.env.tokenAddress
    const registryAddress = process.env.registryAddress
    let outputValues = {
      tokenAddress,
      registryAddress,
      proxyAdminAddress,
      proxyDeployerAddress
    }
    const outputFilePath = path.join(__dirname, 'migration-output.json')
    fs.removeSync(outputFilePath)
    console.log(`Migration output values: ${JSON.stringify(outputValues)}`)
    fs.writeFile(outputFilePath, JSON.stringify(outputValues), (err) => {
      if (err != null) {
        console.log(err)
      }
    })
  })
}
