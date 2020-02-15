const AudiusToken = artifacts.require('AudiusToken')
const ClaimFactory = artifacts.require('ClaimFactory')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    let proxy = await OwnedUpgradeabilityProxy.deployed()
    let stakingAddress = proxy.address
    // let staking = await Staking.at(proxy.address)

    // Deploy new ClaimFactory
    await deployer.deploy(
      ClaimFactory,
      AudiusToken.address,
      stakingAddress)

    let factory = await ClaimFactory.deployed()

    // Replace AudiusToken artifact with AudiusToken.at('0x...') if needed
    let audiusToken = await AudiusToken.at(AudiusToken.address)

    // Register ClaimFactory as minter
    // Note that by default this is called from accounts[0] in ganache
    // During an actual migration, this step should be run independently
    let tokenDeployerAcct = accounts[0]
    await audiusToken.addMinter(factory.address, { from: tokenDeployerAcct })

    console.log('trying 2')
    try {
      console.log(await audiusToken.balanceOf(factory.address))
    } catch (e) {
      console.log(e)
    }

    console.log('trying 3')
    try {
      console.log(await factory.getAddress())
    } catch (e) {
      console.log(e)
    }

    console.log('trying new method')
    try {
      console.log(await factory.getClaimFactoryTokens())
    } catch (e) {
      console.log(e)
    }
  })
}
