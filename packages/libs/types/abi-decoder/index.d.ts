declare module 'abi-decoder' {
  import { Log } from 'web3-core'
  import { AbiItem } from 'web3-utils'

  export interface Input {
    [index: string]: any
    name: string
    type: string
    indexed?: boolean
  }

  export interface Output {
    [index: string]: any
    name: string
    type: string
  }

  export interface Param {
    name: string
    type: string
    value: string
  }

  export interface DecodedLog {
    address: string
    name: string
    events: Param[]
  }

  export interface DecodedMethod {
    name: string
    params: Param[]
  }

  export function getABIs(): AbiItem[]
  export function addABI(abi: AbiItem[]): void
  export function getMethodIDs(): { [index: string]: AbiItem }
  export function decodeMethod(input: string): DecodedMethod
  export function decodeLogs(input: Log[]): DecodedLog
  export function removeABI(abi: AbiItem[]): void
}
