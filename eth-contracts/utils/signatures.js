// adapted from https://github.com/albertocuestacanada/ERC20Permit/blob/master/utils/signatures.ts to not use typescript

import { keccak256, defaultAbiCoder, toUtf8Bytes, solidityPack } from 'ethers-latest/lib/utils'
import { ecsign } from 'ethereumjs-util'

export const sign = (digest, privateKey) => {
  return ecsign(Buffer.from(digest.slice(2), 'hex'), privateKey)
}

export const PERMIT_TYPEHASH = keccak256(
  toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

export const LOCKASSETS_TYPEHASH = keccak256(
  toUtf8Bytes('LockAssets(address from,uint256 amount,bytes32 recipient,uint8 targetChain,uint32 nonce,bool refundDust,uint256 deadline)')
)

// Returns the EIP712 hash which should be signed by the user
// in order to make a call to `permit`
export function getPermitDigest(
  name,
  address,
  chainId,
  approve,
  nonce,
  deadline
) {
  const DOMAIN_SEPARATOR = getDomainSeparator(name, address, chainId)
  return keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
          )
        ),
      ]
    )
  )
}

// Returns the EIP712 hash which should be signed by the user
// in order to make a call to `lockAssets`
export function getLockAssetsDigest(
  name,
  address,
  chainId,
  lockAssets,
  nonce,
  deadline
) {
  const DOMAIN_SEPARATOR = getDomainSeparator(name, address, chainId)

  return keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          defaultAbiCoder.encode(
            [
              'bytes32', 
              'address',
              'uint256',
              'bytes32',
              'uint8',
              'uint32',
              'bool',
              'uint256',
            ],
            [
              LOCKASSETS_TYPEHASH,
            	lockAssets.from,
            	lockAssets.amount,
            	lockAssets.recipient,
            	lockAssets.targetChain,
            	nonce,
            	lockAssets.refundDust,
            	deadline,
            ]
          )
        ),
      ]
    )
  )
}

// Gets the EIP712 domain separator
export function getDomainSeparator(name, contractAddress, chainId) {
  return keccak256(
    defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')),
        keccak256(toUtf8Bytes(name)),
        keccak256(toUtf8Bytes('1')),
        chainId,
        contractAddress,
      ]
    )
  )
}
