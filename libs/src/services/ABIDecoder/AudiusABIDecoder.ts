import abiDecoder from 'abi-decoder'
import { Utils } from '../../utils'
import type { AbiItem, AbiInput } from 'web3-utils'
import type { Log } from 'web3-core'

const abiMap: Record<string, AbiItem[]> = {}

function loadABI(abiFile: string) {
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
loadABI('EntityManager.json')

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- should just use esm
export class AudiusABIDecoder {
  static decodeMethod(contractName: string, encodedABI: string) {
    const decoded = abiDecoder.decodeMethod(encodedABI)
    if (!decoded) {
      throw new Error('No Audius ABI matches given data')
    }

    // hack around abi-decoder's lack of contract-specific support (only one global
    // namespace of functions)
    const abi = abiMap[contractName]
    if (!abi) {
      throw new Error(`Unrecognized contract name ${contractName}`)
    }

    let foundFunction: AbiItem | undefined
    abi.forEach((item) => {
      if (item.type === 'function' && item.name === decoded.name) {
        foundFunction = item
      }
    })

    if (!foundFunction) {
      throw new Error(
        `Unrecognized function ${decoded.name} for contract ${contractName}`
      )
    }

    const paramSpecs = foundFunction.inputs as AbiInput[]
    decoded.params.forEach((param, idx) => {
      if (idx >= paramSpecs.length) {
        throw new Error('Extra parameter')
      }

      const paramSpec = paramSpecs[idx]
      if (paramSpec?.name !== param.name || paramSpec.type !== param.type) {
        throw new Error(
          `Invalid name or value for param ${paramSpec?.name}: ${paramSpec?.type}`
        )
      }
    })

    return decoded
  }

  static decodeLogs(_: string, logs: Log[]) {
    return abiDecoder.decodeLogs(logs)
  }
}
