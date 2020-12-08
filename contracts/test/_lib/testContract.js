/* global assert */
import { web3New } from '../utils/web3New'


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
