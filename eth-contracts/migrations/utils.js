module.exports.logBytecodes = (contract) => {
  console.log(`${contract.contractName} || bytecode: ${contract.bytecode.length} || deployedBytecode: ${contract.deployedBytecode.length}`)
}