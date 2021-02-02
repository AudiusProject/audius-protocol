const DataContracts = {}

DataContracts.getLatestBlockOnChain = async libsWrapper => {
  return libsWrapper.getLatestBlockOnChain()
}

module.exports = DataContracts
