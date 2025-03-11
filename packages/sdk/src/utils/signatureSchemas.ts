/**
 * This file includes schemas for use in EIP-712 compliant signature generation and
 * signature validation, generator functions for generating data
 * in the form needed by eth_personalSign / eth-sig-util's signTypedData functions,
 * generators for contract signing domains, and a helper function for generating
 * cryptographically secure nonces in nodejs or in the browser.
 * modeled off: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
 */
import { bytesToHex as toHex, randomBytes } from '@noble/hashes/utils'
import type { Hex, TypedData } from 'viem'

export const getNonce = async () => {
  return ('0x' + toHex(randomBytes(32))) as Hex
}

const domains = {
  getEntityManagerDomain: (chainId: number, contractAddress: string) => ({
    name: 'Entity Manager',
    version: '1',
    chainId: BigInt(chainId),
    verifyingContract: contractAddress
  })
}

const types = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ],
  ManageEntity: [
    { name: 'userId', type: 'uint' },
    { name: 'entityType', type: 'string' },
    { name: 'entityId', type: 'uint' },
    { name: 'action', type: 'string' },
    { name: 'metadata', type: 'string' },
    { name: 'nonce', type: 'bytes32' }
  ]
} as const satisfies TypedData

export const generators = {
  getManageEntityData: (
    chainId: number,
    contractAddress: string,
    userId: number,
    entityType: string,
    entityId: number,
    action: string,
    metadata: string,
    nonce: string
  ) => {
    const message = {
      userId,
      entityType,
      entityId,
      action,
      metadata,
      nonce
    }
    const domainData = domains.getEntityManagerDomain(chainId, contractAddress)
    return {
      types,
      domain: domainData,
      primaryType: 'ManageEntity' as const,
      message
    }
  }
}
