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

let client: Client<typeof Protocol> | null = null

export const coreRelay = async (
  logger: pino.Logger,
  requestId: string,
  request: ValidatedRelayRequest
) => {
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
      subjectSig
      // nonce: nonceBytes
    } = decodeAbi(encodedABI)

    const signer = request.senderAddress
    const userId = BigInt(userIdBig.toString())
    const entityId = BigInt(entityIdBig.toString())
    const metadata = JSON.stringify(metadataAny)
    const signature = ethers.utils.hexlify(subjectSig)
    // const nonce = ethers.utils.hexlify(nonceBytes)

    const manageEntity = create(ManageEntityLegacySchema, {
      userId,
      entityId,
      entityType,
      action,
      metadata,
      signature,
      signer,
      nonce: BigInt(1),
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
        txhash: txhash
      },
      'core relay success'
    )
  } catch (e) {
    logger.error({ err: e }, 'core relay failure:')
  }
}
