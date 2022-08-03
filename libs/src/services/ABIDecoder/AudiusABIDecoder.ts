import abiDecoder from 'abi-decoder'
import type { AbiItem, AbiInput } from 'web3-utils'
import type { Log } from 'web3-core'

import RegistryABI from '../../data-contracts/ABIs/Registry.json'
import UserFactoryABI from '../../data-contracts/ABIs/UserFactory.json'
import TrackFactoryABI from '../../data-contracts/ABIs/TrackFactory.json'
import DiscoverProviderFactoryABI from '../../data-contracts/ABIs/DiscoveryProviderFactory.json'
import SocialFeatureFactoryABI from '../../data-contracts/ABIs/SocialFeatureFactory.json'
import PlaylistFactoryABI from '../../data-contracts/ABIs/PlaylistFactory.json'
import UserLibraryFactoryABI from '../../data-contracts/ABIs/UserLibraryFactory.json'
import UserReplicaSetManagerABI from '../../data-contracts/ABIs/UserReplicaSetManager.json'

const abiMap: Record<string, AbiItem[]> = {}

;[
  RegistryABI,
  UserFactoryABI,
  TrackFactoryABI,
  DiscoverProviderFactoryABI,
  SocialFeatureFactoryABI,
  PlaylistFactoryABI,
  UserLibraryFactoryABI,
  UserReplicaSetManagerABI
].forEach(({ contractName, abi }) => {
  abiDecoder.addABI(abi as AbiItem[])
  abiMap[contractName] = abi as AbiItem[]
})

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
      throw new Error('Unrecognized contract name')
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
