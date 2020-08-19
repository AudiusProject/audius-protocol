const Migrations = artifacts.require('Migrations')

const logBytecodes = (contract) => {
  console.log(`${contract.contractName} || bytecode: ${contract.bytecode.length} || deployedBytecode: ${contract.deployedBytecode.length}`)
}

/** log out all contract bytecode lengths */
const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const InitializableV2 = artifacts.require('InitializableV2')
const Governance = artifacts.require('Governance')
const ClaimsManager = artifacts.require('ClaimsManager')
const DelegateManager = artifacts.require('DelegateManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const Staking = artifacts.require('Staking')
logBytecodes(AudiusToken)
logBytecodes(Registry)
logBytecodes(InitializableV2)
logBytecodes(Governance)
logBytecodes(ClaimsManager)
logBytecodes(DelegateManager)
logBytecodes(ServiceProviderFactory)
logBytecodes(ServiceTypeManager)
logBytecodes(Staking)


module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
