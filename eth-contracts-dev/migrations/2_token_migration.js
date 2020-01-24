const AudiusToken = artifacts.require('AudiusToken')

module.exports = (deployer, network, accounts) => {
    deployer.deploy(AudiusToken)
}