const fs = require('fs-extra')
const path = require('path')

// Migration to output token and registry addresses
module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const tokenAddress = process.env.tokenAddress
    const registryAddress = process.env.registryAddress
    let outputValues = {
      tokenAddress,
      registryAddress
    }
    const outputFilePath = path.join(__dirname, 'migration-output.json')
    fs.removeSync(outputFilePath)
    fs.writeFile(outputFilePath, JSON.stringify(outputValues), (err) => {
      if (err != null) {
        console.log(err)
      }
    })
  })
}
