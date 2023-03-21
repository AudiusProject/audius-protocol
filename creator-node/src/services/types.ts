export type ReplicaSetSpIds = {
  primaryId: number | undefined
  secondaryIds: number[]
}
export type ReplicaSetEndpoints = {
  primary?: string
  secondary1?: string
  secondary2?: string
}
export type EthContracts = {
  getServiceProviderList: (spType: string) => Promise<LibsServiceProvider[]>
}
export type LibsServiceProvider = {
  owner: any // Libs typed this as any, but the contract has it as address
  delegateOwnerWallet: any // Libs typed this as any, but the contract has it as address
  endpoint: any // Libs typed this as any, but the contract has it as string
  spID: number
  type: string
  blockNumber: number
}
export type ContentNodeFromChain = {
  endpoint: string
  owner: string
  delegateOwnerWallet: string
}
