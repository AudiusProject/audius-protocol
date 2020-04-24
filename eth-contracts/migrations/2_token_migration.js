const AudiusToken = artifacts.require('AudiusToken')

module.exports = (deployer, network, accounts) => {
    deployer.then(async () => {
        const token = await deployer.deploy(AudiusToken, { from: accounts[0] })
        // note - for some reason this call fails if { from } is passed
        await token.initialize()
    })
}