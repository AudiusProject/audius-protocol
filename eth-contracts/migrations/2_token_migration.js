const AudiusToken = artifacts.require('AudiusToken')

module.exports = (deployer, network, accounts) => {
    deployer.then(async () => {
        const token = await deployer.deploy(AudiusToken)
        await token.initialize()
    })
}