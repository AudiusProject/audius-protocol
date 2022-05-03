import { ServiceWithEndpoint } from '../../utils'

export default class EthContracts {
  getCurrentVersion: (serviceName: string) => Promise<string>
  getNumberOfVersions: (spType: string) => Promise<number>
  getVersion: (spType: string, queryIndex: number) => Promise<string>
  getServiceProviderList: (
    serviceName: string
  ) => Promise<ServiceWithEndpoint[]>

  hasSameMajorAndMinorVersion: (version1: string, version2: string) => boolean
  isInRegressedMode: () => boolean
}
