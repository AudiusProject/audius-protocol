import { ecsign, toBuffer } from 'ethereumjs-util'
const Utils = require('../utils')
window.Utils = Utils
window.ecsign = ecsign
window.toBuffer = toBuffer
export const sign = (digest, privateKey) => {
  console.log('siging')
  console.log({ digest, privateKey })
  // let signature = ecsign(toBuffer(digest.slice(2)), privateKey)
  let signature = ecsign(toBuffer(digest), privateKey)
  console.log('done signeding')
  return signature
}

export const PERMIT_TYPEHASH = Utils.keccak256(
  'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
)

// Returns the EIP712 hash which should be signed by the user
// in order to make a call to `permit`
export function getPermitDigest(
  web3,
  name,
  address,
  chainId,
  approve,
  nonce,
  deadline
) {
  console.log('staring')
  const DOMAIN_SEPARATOR = getDomainSeparator(web3, name, address, chainId)

  let innerEncoded = web3.eth.abi.encodeParameters(
    ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
    [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
  )
  console.log({ innerEncoded })
  let encoded = web3.eth.abi.encodeParameters(
    ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
    [
      '0x19',
      '0x01',
      DOMAIN_SEPARATOR,
      Utils.keccak256(innerEncoded),
    ]
  )
  console.log({ encoded })

  return Utils.keccak256(encoded)
}

// Gets the EIP712 domain separator
export function getDomainSeparator(web3, name, contractAddress, chainId) {
  console.log({ web3, name, contractAddress, chainId })
  const encoded = web3.eth.abi.encodeParameters(
    ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
    [
      Utils.keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
      Utils.keccak256(name),
      Utils.keccak256('1'),
      chainId,
      contractAddress,
    ]
  )
    console.log({ domainEncoede: encoded })
  return Utils.keccak256(encoded)
}