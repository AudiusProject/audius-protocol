const Utils = require('../utils')

const { ecsign, toBuffer } = require('ethereumjs-util')
const { pack } = require('@ethersproject/solidity')

const sign = (digest, privateKey) => {
  const buffer = toBuffer(digest)
  let signature = ecsign(buffer, privateKey)
  return signature
}

const PERMIT_TYPEHASH = Utils.keccak256(
  'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
)

// Returns the EIP712 hash which should be signed by the user
// in order to make a call to `permit`
function getPermitDigest (
  web3,
  name,
  address,
  chainId,
  approve,
  nonce,
  deadline
) {
  const DOMAIN_SEPARATOR = getDomainSeparator(web3, name, address, chainId)

  let innerEncoded = web3.eth.abi.encodeParameters(
    ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
    [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
  )
  let encoded = pack(
    ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
    [
      '0x19',
      '0x01',
      DOMAIN_SEPARATOR,
      Utils.keccak256(innerEncoded)
    ]
  )
  return Utils.keccak256(encoded)
}

// Gets the EIP712 domain separator
function getDomainSeparator (web3, name, contractAddress, chainId) {
  const encoded = web3.eth.abi.encodeParameters(
    ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
    [
      Utils.keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
      Utils.keccak256(name),
      Utils.keccak256('1'),
      chainId,
      contractAddress
    ]
  )
  return Utils.keccak256(encoded)
}

module.expots = {
  sign,
  getPermitDigest
}
