import { Utils } from './utils'
import { BN, ecsign, toBuffer } from 'ethereumjs-util'
import { pack } from '@ethersproject/solidity'
import type Web3 from 'web3'
import { domains, schemas, generators, getNonce } from "../data-contracts/signatureSchemas"
import { AudiusABIDecoder } from '../AudiusLibs'
import sigUtil from 'eth-sig-util'

export const sign = (digest: any, privateKey: Buffer) => {
  const buffer = toBuffer(digest)
  const signature = ecsign(buffer, privateKey)
  return signature
}

// lazyload permitTypehash to avoid a web3 race
let _permitTypehash: null | string = null
const getPermitTypehash = () => {
  if (!_permitTypehash) {
    _permitTypehash = Utils.keccak256(
      'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
    )
  }
  return _permitTypehash
}

let _transferTokensTypehash: null | string = null
const getTransferTokensTypeHash = () => {
  if (!_transferTokensTypehash) {
    _transferTokensTypehash = Utils.keccak256(
      'TransferTokens(address from,uint256 amount,uint16 recipientChain,bytes32 recipient,uint256 artbiterFee,uint32 nonce,uint256 deadline)'
    )
  }
  return _transferTokensTypehash
}

export interface ApproveTokens {
  owner: string
  spender: string
  value: BN
}

// Returns the EIP712 hash which should be signed by the user
// in order to make a call to `permit`
export function getPermitDigest(
  web3: Web3,
  name: string,
  address: string,
  chainId: number,
  approve: ApproveTokens,
  nonce: number,
  deadline: number
) {
  const DOMAIN_SEPARATOR = getDomainSeparator(web3, name, address, chainId)

  const innerEncoded = web3.eth.abi.encodeParameters(
    ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
    [
      getPermitTypehash(),
      approve.owner,
      approve.spender,
      approve.value,
      nonce,
      deadline
    ]
  )
  const encoded = pack(
    ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
    ['0x19', '0x01', DOMAIN_SEPARATOR, Utils.keccak256(innerEncoded)]
  )
  return Utils.keccak256(encoded)
}

export interface TransferTokens {
  from: string
  amount: BN
  recipientChain: number
  recipient: Buffer
  arbiterFee: BN
}

// Returns the EIP712 hash which should be signed by the user
// in order to make a call to `transferTokens`
export function getTransferTokensDigest(
  web3: Web3,
  name: string,
  address: string,
  chainId: number,
  transferTokens: TransferTokens,
  nonce: number,
  deadline: number
) {
  const DOMAIN_SEPARATOR = getDomainSeparator(web3, name, address, chainId)
  const innerEncoded = web3.eth.abi.encodeParameters(
    [
      'bytes32',
      'address',
      'uint256',
      'uint16',
      'bytes32',
      'uint256',
      'uint32',
      'uint256'
    ],
    [
      getTransferTokensTypeHash(),
      transferTokens.from,
      transferTokens.amount,
      transferTokens.recipientChain,
      transferTokens.recipient,
      transferTokens.arbiterFee,
      nonce,
      deadline
    ]
  )
  const encoded = pack(
    ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
    ['0x19', '0x01', DOMAIN_SEPARATOR, Utils.keccak256(innerEncoded)]
  )
  return Utils.keccak256(encoded)
}

// Gets the EIP712 domain separator
function getDomainSeparator(
  web3: Web3,
  name: string,
  contractAddress: string,
  chainId: number
) {
  const encoded = web3.eth.abi.encodeParameters(
    ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
    [
      Utils.keccak256(
        'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
      ),
      Utils.keccak256(name),
      Utils.keccak256('1'),
      chainId,
      contractAddress
    ]
  )
  return Utils.keccak256(encoded)
}

// re-export sig schemas and recover signer function
export { domains, schemas, generators, getNonce }

export function decodeAbi (encodedABI: string): Map<string, string> {
  const decodedABI = AudiusABIDecoder.decodeMethod('EntityManager', encodedABI)
  const mapping = new Map()

  // map without leading underscore in _userId
  decodedABI.params.forEach((param) => {
    mapping.set(param.name.substring(1), param.value)
  })

  return mapping
}

export function recoverSigner({encodedAbi, chainId, entityManagerAddress } : { encodedAbi: string, chainId: string, entityManagerAddress: string }): string {
  const decodedAbi = decodeAbi(encodedAbi)
  const data = generators.getManageEntityData(
    chainId,
    entityManagerAddress,
    decodedAbi.get("userId"),
    decodedAbi.get("entityType"),
    decodedAbi.get("entityId"),
    decodedAbi.get("action"),
    decodedAbi.get("metadata"),
    decodedAbi.get("nonce")
  )
  const sig = decodedAbi.get("subjectSig")
  if (sig === undefined) throw new Error("subjectSig is not present in decoded abi")
  return sigUtil.recoverTypedSignature({ data, sig })
}
