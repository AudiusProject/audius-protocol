const contractConfig = require('../contract-config.js')
const abi = require('ethereumjs-abi')
const Registry = artifacts.require('Registry')
const ProofOfAudiusConsensus = artifacts.require('ProofOfAudiusConsensus')
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
    console.log(network)

    let deployLogicTx = await deployer.deploy(ProofOfAudiusConsensus)
    const logicContractAddress = deployLogicTx.address
    const proxyAdminAddress = config.blacklisterAddress || accounts[accounts.length - 1]
    const seedAddress = '0xd65126677D01FB5045CE44A5f3a986139893517D'
    let networkId = 99
    if (network === 'development') {
        networkId = Registry.network_id
    }

    let initializePoaContractData = encodeCall(
        'initialize',
        [
           'address',
           'uint'
        ],
        [
           seedAddress,
           networkId
        ]
    )
    console.log(`Deploying proxy... ${networkId}`)
    let deployedProxyTx = await deployer.deploy(
      AdminUpgradeabilityProxy,
      logicContractAddress,
      proxyAdminAddress,
      initializePoaContractData
    )
    console.log(`Proxy deploy tx ${JSON.stringify(deployedProxyTx.address)}`)
  })
}