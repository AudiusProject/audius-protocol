const DataContracts = {}

DataContracts.getLatestBlockOnChain = async libsWrapper => {
  return libsWrapper.getLatestBlockOnChain()
}

DataContracts.getURSMContentNodes = async (libsWrapper, ownerWallet) => {
  return libsWrapper.getURSMContentNodes(ownerWallet)
}

module.exports = DataContracts
