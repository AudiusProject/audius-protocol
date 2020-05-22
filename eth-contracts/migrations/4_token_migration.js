const contractConfig = require('../contract-config.js')
const { encodeCall } = require('../utils/lib')
const assert = require('assert')

const AudiusToken = artifacts.require('AudiusToken')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const governanceKey = web3.utils.utf8ToHex('Governance')

const INITIAL_SUPPLY = Math.pow(10,27)

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const tokenOwnerAddress = proxyDeployerAddress

    const registryAddress = process.env.registryAddress
    const governanceAddress = process.env.governanceAddress

    // Deploy AudiusToken logic and proxy contracts
    const token0 = await deployer.deploy(AudiusToken, { from: proxyDeployerAddress })
    const initializeCallData = encodeCall(
      'initialize',
      ['address', 'address'],
      [tokenOwnerAddress, governanceAddress]
    )
    const tokenProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      token0.address,
      proxyAdminAddress,
      initializeCallData,
      registryAddress,
      governanceKey,
      { from: proxyDeployerAddress }
    )
    const token = await AudiusToken.at(tokenProxy.address)

    // Confirm initial token supply
    assert.equal(await token.totalSupply.call(), INITIAL_SUPPLY)

    // Confirm total supply is in owner account
    assert.equal(await token.balanceOf.call(tokenOwnerAddress), INITIAL_SUPPLY)

    // Confirm governance has minter + pauser roles
    assert.equal(await token.isMinter.call(governanceAddress), true)
    assert.equal(await token.isMinter.call(tokenOwnerAddress), false)

    // Export to env for reference in future migrations
    process.env.tokenAddress = token.address
  })
}
