const abiDecoder = require('abi-decoder')
const Utils = require('../../utils')

const abiMap = {}

function loadABI (abiFile) {
  const contract = Utils.importDataContractABI(abiFile)
  abiDecoder.addABI(contract.abi)
  abiMap[contract.contractName] = contract.abi
}

loadABI('Registry.json')
loadABI('UserFactory.json')
loadABI('TrackFactory.json')
loadABI('DiscoveryProviderFactory.json')
loadABI('SocialFeatureFactory.json')
loadABI('PlaylistFactory.json')
loadABI('UserLibraryFactory.json')
loadABI('UserReplicaSetManager.json')

class AudiusABIDecoder {
  static decodeMethod (contractName, encodedABI) {
    const decoded = abiDecoder.decodeMethod(encodedABI)
    if (!decoded) {
      throw new Error('No Audius ABI matches given data')
    }

    // hack around abi-decoder's lack of contract-specific support (only one global
    // namespace of functions)
    const abi = abiMap[contractName]
    if (!abi) {
      throw new Error('Unrecognized contract name')
    }

    let foundFunction
    abi.forEach((item) => {
      if (item.type === 'function' && item.name === decoded.name) {
        foundFunction = item
      }
    })
    if (!foundFunction) {
      throw new Error('Unrecognized function ' + decoded.name + ' for contract ' + contractName)
    }

    const paramSpecs = foundFunction.inputs
    decoded.params.forEach((param, idx) => {
      if (idx >= paramSpecs.length) {
        throw new Error('Extra parameter')
      }

      const paramSpec = paramSpecs[idx]
      if (paramSpec.name !== param.name || paramSpec.type !== param.type) {
        throw new Error('Invalid name or value for param ' + paramSpec.name + ': ' + paramSpec.type)
      }
    })

    return decoded
  }

  static decodeLogs (contractName, logs) {
    return abiDecoder.decodeLogs(logs)
  }
}

module.exports = AudiusABIDecoder
