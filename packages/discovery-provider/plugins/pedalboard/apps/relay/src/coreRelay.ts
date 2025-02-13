import { ethers } from 'ethers'
import { decodeAbi } from './abi.js'
import { create } from "@bufbuild/protobuf"
import { createClient, Client } from '@connectrpc/connect'
import { createGrpcTransport } from '@connectrpc/connect-node'
import {
  Protocol,
  SignedTransactionSchema,
  ManageEntityLegacySchema
} from './core-sdk/protocol_pb'
import { ValidatedRelayRequest } from './types/relay'
import * as grpc from '@grpc/grpc-js'
import { readConfig } from './config/config.js'
import pino from 'pino'
import { TransactionReceipt } from 'web3-core'

let client: Client<typeof Protocol> | null = null

type CoreRelayResponse = {
  txhash: string
  block: bigint
  blockhash: string
}

export const coreRelay = async (
  logger: pino.Logger,
  requestId: string,
  request: ValidatedRelayRequest
): Promise<TransactionReceipt | null> => {
  try {
    if (client === null) {
      const config = readConfig()
      const transport = createGrpcTransport({
        baseUrl: config.coreEndpoint,
        useBinaryFormat: true
      })
      client = createClient(Protocol, transport)
    }

    const { encodedABI } = request

    const {
      userId: userIdBig,
      entityId: entityIdBig,
      entityType,
      action,
      metadata: metadataAny,
      subjectSig,
      nonce: nonceBytes
    } = decodeAbi(encodedABI)

    const signer = request.senderAddress
    const userId = BigInt(userIdBig.toString())
    const entityId = BigInt(entityIdBig.toString())
    const metadata = metadataAny as string
    const signature = ethers.utils.hexlify(subjectSig)
    const nonce = ethers.utils.hexlify(nonceBytes)

    const manageEntity = create(ManageEntityLegacySchema, {
      userId,
      entityId,
      entityType,
      action,
      metadata,
      signature,
      signer,
      nonce,
    })

    const signedTransaction = create(SignedTransactionSchema, {
      signature,
      transaction: {
        case: "manageEntity" as const,
        value: manageEntity
      },
      requestId: requestId,
    })

    const res = await client.sendTransaction({
      transaction: signedTransaction
    })

    const { transaction, txhash } = res
    logger.info(
      {
        tx: transaction,
        txhash: txhash,
        block: res.blockHeight,
        blockhash: res.blockHash
      },
      'core relay success'
    )
    return {
      status: true,
      transactionHash: txhash,
      transactionIndex: 0,
      blockHash: res.blockHash,
      blockNumber: Number(res.blockHeight),
      from: signer || "",
      to: signer || "",
      cumulativeGasUsed: 10,
      gasUsed: 10,
      effectiveGasPrice: 420,
      logs: [],
      logsBloom: ""
    }
  } catch (e) {
    logger.error({ err: e }, 'core relay failure:')
    return null
  }
}
