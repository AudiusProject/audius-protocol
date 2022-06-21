const contractConfig = require('../contract-config.js')
const abi = require('ethereumjs-abi')
const AudiusData = artifacts.require('AudiusData')
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
      const proxyAdminAddress = config.blacklisterAddress || accounts[accounts.length - 1]
        const networkId = await web3.eth.net.getId()
        console.log(`Deploying AudiusData to ${networkId}`)
        const deployLogicTx = await deployer.deploy(AudiusData)
        const logicContractAddress = deployLogicTx.address
        console.log(logicContractAddress)
        const verifierAddress = config.verifierAddress || accounts[0]
        const initializeData = encodeCall(
            'initialize',
            [
                'address',
                'uint'
            ],
            [
            verifierAddress,
            networkId
            ]
        )
        // Deploy proxy contract with encoded initialize function
        let deployedProxyTx = await deployer.deploy(
            AdminUpgradeabilityProxy,
            logicContractAddress,
            proxyAdminAddress,
            initializeData
        )
        let audiusDataProxyAddress = deployedProxyTx.address
        console.log(`AudiusData Proxy Contract deployed at ${audiusDataProxyAddress}`)
    })
}
