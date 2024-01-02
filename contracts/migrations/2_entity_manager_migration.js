const fs = require('fs-extra')
const path = require('path')
const contractConfig = require('../contract-config.js')
const abi = require('ethereumjs-abi')
const EntityManager = artifacts.require('EntityManager')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')

// Generate encoded arguments for proxy initialization
const encodeCall = (name, args, values) => {
  const methodId = abi.methodID(name, args).toString('hex')
  const params = abi.rawEncode(args, values).toString('hex')
  return '0x' + methodId + params
}

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress =
      config.blacklisterAddress || accounts[accounts.length - 1]
    const chainId = await web3.eth.getChainId()
    console.log(`Deploying EntityManager to ${chainId}`)
    const deployLogicTx = await deployer.deploy(EntityManager)
    const logicContractAddress = deployLogicTx.address
    console.log(logicContractAddress)
    const verifierAddress = config.verifierAddress || accounts[0]
    const initializeData = encodeCall(
      'initialize',
      ['address', 'uint'],
      [verifierAddress, chainId]
    )
    // Deploy proxy contract with encoded initialize function
    let deployedProxyTx = await deployer.deploy(
      AdminUpgradeabilityProxy,
      logicContractAddress,
      proxyAdminAddress,
      initializeData
    )
    let entityManagerProxyAddress = deployedProxyTx.address
    console.log(
      `EntityManager Proxy Contract deployed at ${entityManagerProxyAddress}`
    )
    process.env.entityManagerProxyAddress = entityManagerProxyAddress
    const outputFilePath = path.join(__dirname, 'migration-output.json')
    fs.removeSync(outputFilePath)
    const registryAddress = process.env.dataContractsRegistryAddress
    const ursmAddress = process.env.dataContractsUrsmAddress
    const outputValues = {
      entityManagerProxyAddress,
      registryAddress,
      ursmAddress
    }
    fs.removeSync(outputFilePath)
    console.log(`Migration output values: ${JSON.stringify(outputValues)}`)
    fs.writeFile(outputFilePath, JSON.stringify(outputValues), (err) => {
      if (err != null) {
        console.log(err)
      }
    })
  })
}
