import { ContractClient } from '../contracts/ContractClient'
import * as signatureSchemas from '../../signatureSchemas'
import sigUtil, { EIP712TypedData } from 'eth-sig-util'
import { Buffer as SafeBuffer } from 'safe-buffer'
import type { Web3Manager } from '../web3Manager'

type GeneratorFn = (
  chainId: number,
  contractAddress: string,
  multihashDigest: string,
  nonce: string
) => EIP712TypedData

export class IPLDBlacklistFactoryClient extends ContractClient {
  async addIPLDToBlacklist(multihashDigest: string, privateKey = null) {
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.addIPLDToBlacklistRequestData,
      multihashDigest,
      privateKey
    )
    const method = await this.getMethod(
      'addIPLDToBlacklist',
      multihashDigest,
      nonce,
      sig
    )

    const receipt = await method.send({
      from: this.web3Manager.getWalletAddress(),
      gas: 200000
    })
    return receipt
  }

  /* ------- HELPERS ------- */

  /**
   * Gets a nonce and generates a signature for the given function. Private key is optional and
   * will use that private key to create the  signature. Otherwise the web3Manager private key
   * will be used.
   * @param generatorFn signature scheme object function
   * @param multihashDigest blockchain userId
   * @param privateKey optional. if this is passed in, the signature will be from
   * this private key. the type is a 64 character hex string
   */
  async getUpdateNonceAndSig(
    generatorFn: GeneratorFn,
    multihashDigest: string,
    privateKey: string | null
  ) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = generatorFn(
      chainId,
      contractAddress,
      multihashDigest,
      nonce
    )
    let sig
    if (privateKey) {
      sig = sigUtil.signTypedData(
        SafeBuffer.from(privateKey, 'hex') as unknown as Buffer,
        {
          data: signatureData
        }
      )
    } else {
      sig = await (this.web3Manager as Web3Manager).signTypedData(signatureData)
    }
    return [nonce, sig]
  }
}
