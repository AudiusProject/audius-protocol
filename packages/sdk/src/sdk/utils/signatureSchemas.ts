/**
 * This file includes schemas for use in EIP-712 compliant signature generation and
 * signature validation, generator functions for generating data
 * in the form needed by eth_personalSign / eth-sig-util's signTypedData functions,
 * generators for contract signing domains, and a helper function for generating
 * cryptographically secure nonces in nodejs or in the browser.
 * modeled off: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
 */
import { bytesToHex as toHex, randomBytes } from '@noble/hashes/utils'

export const getNonce = async () => {
  return '0x' + toHex(randomBytes(32))
}

const domains = {
  getEntityManagerDomain: (chainId: number, contractAddress: string) => ({
    name: 'Entity Manager',
    version: '1',
    chainId,
    verifyingContract: contractAddress
  })
}

const schemas = {
  domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ],
  manageEntity: [
    { name: 'userId', type: 'uint' },
    { name: 'entityType', type: 'string' },
    { name: 'entityId', type: 'uint' },
    { name: 'action', type: 'string' },
    { name: 'metadata', type: 'string' },
    { name: 'nonce', type: 'bytes32' }
  ]
}

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
    const types = {
      EIP712Domain: schemas.domain,
      ManageEntity: schemas.manageEntity
    }
    return {
      types,
      domain: domainData,
      primaryType: 'ManageEntity',
      message
    }
  }
}
