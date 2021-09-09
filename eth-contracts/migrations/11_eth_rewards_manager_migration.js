const contractConfig = require('../contract-config.js')
const fs = require('fs')
const path = require('path')
const os = require('os')
const _lib = require('../utils/lib')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const EthRewardsManager = artifacts.require('EthRewardsManager')
const Governance = artifacts.require('Governance')
const MockWormhole = artifacts.require('MockWormhole')

const ethRewardsManagerProxyKey = web3.utils.utf8ToHex('EthRewardsManagerProxy')


const outputAAOAccounts = (accounts) => {
  const homeFolder = path.join(os.homedir(), '/.audius')
  if (!fs.existsSync(homeFolder)) {
    fs.mkdirSync(homeFolder, { recursive: true })
  }

  fs.writeFileSync(
    path.join(homeFolder, 'aao-config.json'),
    JSON.stringify(accounts), 
    'utf8'
  )
}

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress
    const solanaRecipientAddress = config.solanaRecipientAddress || Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')

    const AAO_ACCOUNT_BASE = 20
    const aaoAccounts = [accounts[AAO_ACCOUNT_BASE], accounts[AAO_ACCOUNT_BASE + 1], accounts[AAO_ACCOUNT_BASE + 2]]

    if (network === 'test_local' || network === 'development') {
      outputAAOAccounts(aaoAccounts)
    }

    const antiAbuseOracleAddresses = config.antiAbuseOracleAddresses || aaoAccounts
    let wormholeAddress = config.wormholeAddress

    const tokenAddress = process.env.tokenAddress
    const governanceAddress = process.env.governanceAddress

    const governance = await Governance.at(governanceAddress)

    if (wormholeAddress === null) {
      const mockWormhole = await deployer.deploy(MockWormhole, { from: proxyDeployerAddress })
      wormholeAddress = mockWormhole.address
    }

    // Deploy EthRewardsManager logic and proxy contracts + register proxy
    const ethRewardsManager0 = await deployer.deploy(EthRewardsManager, { from: proxyDeployerAddress })
    const initializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'address', 'bytes32', 'address[]'],
      [tokenAddress, governanceAddress, wormholeAddress, solanaRecipientAddress, antiAbuseOracleAddresses]
    )

    const ethRewardsManagerProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      ethRewardsManager0.address,
      governanceAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )

    const ethRewardsManager = await EthRewardsManager.at(ethRewardsManagerProxy.address)
    _lib.registerContract(governance, ethRewardsManagerProxyKey, ethRewardsManagerProxy.address, guardianAddress)

    // Set environment variable
    process.env.ethRewardsManagerAddress = ethRewardsManagerProxy.address
  })
}
