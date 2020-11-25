/* global assert */
import { web3New } from '../utils/web3New'

const abi = require('ethereumjs-abi')

export const unregisterContractAndValidate = async (registry, contractRegistryKey, contractInstanceAddress) => {
  await registry.removeContract(contractRegistryKey)
  await assertNoContractExists(contractInstanceAddress)
}

/** Asserts that no contract exists at the given address.
 *  @param {string} - address to check
 */
export const assertNoContractExists = async (contractAddress) => {
  const contractCode = await web3New.eth.getCode(contractAddress)
  assert(contractCode === '0x0' || contractCode === '0x', // geth returns 0 as '0x', ganache returns it as '0'. This supports both.
    'Expected no contract at given address')
}

// Generate encoded arguments for proxy initialization
export const encodeCall = (name, args, values) => {
  const methodId = abi.methodID(name, args).toString('hex')
  const params = abi.rawEncode(args, values).toString('hex')
  return '0x' + methodId + params
}