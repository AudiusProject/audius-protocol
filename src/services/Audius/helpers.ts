import { Utils } from '@audius/libs'
import { formatNumber, formatAudString } from 'utils/format'
import AudiusClient from './AudiusClient'
import { Permission, BigNumber } from 'types'
import { fetchWithTimeout } from 'utils/fetch'
import BN from 'bn.js'

// Helpers
export async function hasPermissions(
  this: AudiusClient,
  ...permissions: Array<Permission>
) {
  await this.awaitSetup()
  if (permissions.includes(Permission.WRITE) && !this.hasValidAccount) {
    throw new Error('Libs not configured')
  }
}

export async function awaitSetup(this: AudiusClient): Promise<void> {
  return new Promise(resolve => {
    let checkLoginStatusInterval: number = window.setInterval(() => {
      if (this.isSetup) {
        clearInterval(checkLoginStatusInterval)
        resolve()
      }
    }, 100)
  })
}

export async function getEthBlockNumber(this: AudiusClient) {
  await this.hasPermissions()
  return this.libs.ethWeb3Manager.web3.eth.getBlockNumber()
}

export async function getEthWallet(this: AudiusClient) {
  await this.hasPermissions()
  return this.libs.ethWeb3Manager.ownerWallet
}

export async function getAverageBlockTime(this: AudiusClient) {
  await this.hasPermissions()
  const web3 = this.libs.ethWeb3Manager.web3
  const span = 1000
  const currentNumber = await web3.eth.getBlockNumber()
  const currentBlock = await web3.eth.getBlock(currentNumber)
  let firstBlock
  try {
    firstBlock = await web3.eth.getBlock(currentNumber - span)
  } catch (e) {
    firstBlock = await web3.eth.getBlock(1)
  }
  return Math.round(
    (currentBlock.timestamp - firstBlock.timestamp) / (span * 1.0)
  )
}

export async function getBlock(this: AudiusClient, blockNumber: number) {
  await this.hasPermissions()
  const web3 = this.libs.ethWeb3Manager.web3
  const block = await web3.eth.getBlock(blockNumber)
  return block
}

export async function getBlockNearTimestamp(
  this: AudiusClient,
  averageBlockTime: number,
  currentBlockNumber: number,
  timestamp: number
) {
  await this.hasPermissions()
  const web3 = this.libs.ethWeb3Manager.web3
  const now = new Date()
  const then = new Date(timestamp)
  // @ts-ignore: date subtraction works
  const seconds = (now - then) / 1000
  const blocks = Math.round(seconds / averageBlockTime)
  const targetNumber = Math.max(currentBlockNumber - blocks, 0)
  const targetBlock = await web3.eth.getBlock(targetNumber)
  return targetBlock
}

export function toChecksumAddress(this: AudiusClient, wallet: string) {
  // NOTE: This is kinda a hack
  // but b/c we load in web3 before the js bundle it will work
  const web3 = window.Web3
  return web3.utils.toChecksumAddress(wallet)
}

// Static Helpers
export function getBNPercentage(
  n1: BigNumber,
  n2: BigNumber,
  decimals: number = 2
): number {
  const divisor = Math.pow(10, decimals + 1)
  if (n2.toString() === '0') return 0
  let num = n1.mul(Utils.toBN(divisor.toString())).div(n2)
  if (num.gte(Utils.toBN(divisor.toString()))) return 1
  return num.toNumber() / divisor
}

export function displayShortAud(amount: BigNumber) {
  return formatNumber(amount.div(Utils.toBN('1000000000000000000') as BN))
}

export function displayAud(amount: BigNumber) {
  return formatAudString(getAud(amount))
}

export function getAud(amount: BigNumber) {
  const aud = amount.div(Utils.toBN('1000000000000000000'))
  const wei = amount.sub(aud.mul(Utils.toBN('1000000000000000000')))
  if (wei.isZero()) {
    return aud.toString()
  }
  const decimals = wei.toString().padStart(18, '0')
  return `${aud}.${trimRightZeros(decimals)}`
}

export function trimRightZeros(number: string) {
  return number.replace(/(\d)0+$/gm, '$1')
}

export function getWei(amount: BigNumber) {
  return amount.mul(Utils.toBN('1000000000000000000'))
}

export async function getNodeVersion(endpoint: string): Promise<string> {
  try {
    const version = await fetchWithTimeout(`${endpoint}/health_check`).then(
      r => r.data.version
    )
    return version
  } catch (e) {
    console.error(e)
    // Return no version if we couldn't find one, so we don't hold everything up
    return ''
  }
}
